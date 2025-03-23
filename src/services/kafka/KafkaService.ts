import { Kafka, Producer, Consumer, CompressionTypes, Message } from 'kafkajs';
import config from '../../config';
import { logger } from '../../utils/logger';
import { ScraperResult } from '../scrapers/BaseScraper';

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  /**
   * Initialize the Kafka producer
   */
  async initProducer(): Promise<void> {
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to initialize Kafka producer:', error);
      throw error;
    }
  }

  /**
   * Send a message to a Kafka topic
   */
  async sendMessage(topic: string, message: any, key?: string): Promise<void> {
    if (!this.producer) {
      await this.initProducer();
    }

    try {
      const kafkaMessage: Message = {
        value: JSON.stringify(message),
      };

      if (key) {
        kafkaMessage.key = key;
      }

      await this.producer!.send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [kafkaMessage],
      });

      logger.debug(`Message sent to topic: ${topic}`);
    } catch (error) {
      logger.error(`Error sending message to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Send multiple scraper results to Kafka
   */
  async sendScraperResults(results: ScraperResult[]): Promise<void> {
    if (results.length === 0) return;

    try {
      const messages: Message[] = results.map(result => ({
        key: Buffer.from(result.url),
        value: JSON.stringify(result),
      }));

      if (!this.producer) {
        await this.initProducer();
      }

      await this.producer!.send({
        topic: config.kafka.topics.articles,
        compression: CompressionTypes.GZIP,
        messages,
      });

      logger.info(`Sent ${results.length} articles to Kafka`);
    } catch (error) {
      logger.error('Error sending scraper results to Kafka:', error);
      throw error;
    }
  }

  /**
   * Create a consumer for a given topic
   */
  async createConsumer(groupId: string): Promise<Consumer> {
    try {
      const consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      logger.info(`Kafka consumer for group ${groupId} connected successfully`);
      this.consumers.set(groupId, consumer);
      return consumer;
    } catch (error) {
      logger.error(
        `Failed to create Kafka consumer for group ${groupId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Subscribe a consumer to a topic and process messages
   */
  async subscribe(
    consumer: Consumer,
    topic: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    try {
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;

            const parsedMessage = JSON.parse(message.value.toString());
            await callback(parsedMessage);
          } catch (error) {
            logger.error(
              `Error processing Kafka message from topic ${topic}:`,
              error
            );
          }
        },
      });

      logger.info(`Subscribed to Kafka topic: ${topic}`);
    } catch (error) {
      logger.error(`Error subscribing to Kafka topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Gracefully disconnect all Kafka clients
   */
  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }

      for (const [groupId, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        logger.info(`Kafka consumer for group ${groupId} disconnected`);
      }

      this.consumers.clear();
    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
    }
  }
}

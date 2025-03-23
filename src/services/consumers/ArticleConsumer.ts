import { KafkaService } from '../kafka/KafkaService';
import { ArticleService } from '../ArticleService';
import { ScraperResult } from '../scrapers/BaseScraper';
import config from '../../config';
import { logger } from '../../utils/logger';

export class ArticleConsumer {
  private kafkaService: KafkaService;
  private articleService: ArticleService;

  constructor() {
    this.kafkaService = new KafkaService();
    this.articleService = new ArticleService();
  }

  /**
   * Start the consumer to process articles
   */
  async start(): Promise<void> {
    try {
      const consumer = await this.kafkaService.createConsumer(
        config.kafka.groupId
      );

      // Subscribe to the raw articles topic
      await this.kafkaService.subscribe(
        consumer,
        config.kafka.topics.articles,
        this.processArticle.bind(this)
      );

      logger.info('Article consumer started successfully');
    } catch (error) {
      logger.error('Failed to start article consumer:', error);
      throw error;
    }
  }

  /**
   * Process a single article from Kafka
   */
  private async processArticle(message: ScraperResult): Promise<void> {
    try {
      logger.debug(`Processing article: ${message.title}`);

      // Save the article to the database
      const savedArticle = await this.articleService.saveArticle(message);

      if (savedArticle) {
        logger.debug(`Successfully processed article: ${message.title}`);

        // You could send the processed article to another Kafka topic if needed
        await this.kafkaService.sendMessage(
          config.kafka.topics.processedArticles,
          {
            id: savedArticle.id,
            title: savedArticle.title,
            url: savedArticle.url,
            source: savedArticle.source,
            publishedAt: savedArticle.publishedAt,
          },
          savedArticle.id
        );
      }
    } catch (error) {
      logger.error(`Error processing article: ${message.title}`, error);
    }
  }

  /**
   * Gracefully stop the consumer
   */
  async stop(): Promise<void> {
    try {
      await this.kafkaService.disconnect();
      logger.info('Article consumer stopped successfully');
    } catch (error) {
      logger.error('Error stopping article consumer:', error);
    }
  }
}

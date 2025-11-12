import { DataSource } from 'typeorm';
import { config } from 'dotenv';

async function checkCommentLikesSchema() {
  // Load environment variables
  config();

  // Create a new DataSource instance
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'blogger_platform',
    entities: ['src/**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    // Initialize the DataSource
    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    // Get the table metadata
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if the commentLikes table exists
    const tableExists = await queryRunner.hasTable('commentLikes');
    console.log('commentLikes table exists:', tableExists);

    if (tableExists) {
      // Get the table columns
      const table = await queryRunner.getTable('commentLikes');
      console.log('Table columns:');
      table?.columns.forEach(column => {
        console.log(`- ${column.name}: ${column.type}${column.isNullable ? ' (nullable)' : ''} ${column.isPrimary ? ' (primary)' : ''}`);
        if (column.enum) {
          console.log(`  Enum values: ${column.enum.join(', ')}`);
        }
      });
    }

    await queryRunner.release();
  } catch (err) {
    console.error('Error during Data Source initialization', err);
  } finally {
    await dataSource.destroy();
  }
}

checkCommentLikesSchema().catch(console.error);

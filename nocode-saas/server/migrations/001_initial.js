/**
 * Initial migration — Core platform tables
 */
exports.up = function (knex) {
  return knex.schema
    // Tenants
    .createTable('tenants', (table) => {
      table.uuid('id').primary();
      table.string('name', 255).notNullable();
      table.string('slug', 100).unique().notNullable();
      table.string('plan', 50).defaultTo('free');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Users
    .createTable('users', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('email', 255).unique().notNullable();
      table.string('password', 255).notNullable();
      table.string('role', 50).defaultTo('owner');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Apps
    .createTable('apps', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.text('description');
      table.string('status', 20).defaultTo('draft');
      table.jsonb('settings').defaultTo('{}');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    // Table Schemas
    .createTable('table_schemas', (table) => {
      table.uuid('id').primary();
      table.uuid('app_id').notNullable().references('id').inTable('apps').onDelete('CASCADE');
      table.string('table_name', 100).notNullable();
      table.jsonb('fields').notNullable();
      table.jsonb('indexes').defaultTo('[]');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['app_id', 'table_name']);
    })
    // UI Configs
    .createTable('ui_configs', (table) => {
      table.uuid('id').primary();
      table.uuid('app_id').notNullable().references('id').inTable('apps').onDelete('CASCADE');
      table.string('page_name', 100).notNullable();
      table.jsonb('layout').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['app_id', 'page_name']);
    })
    // App Modules
    .createTable('app_modules', (table) => {
      table.uuid('id').primary();
      table.uuid('app_id').notNullable().references('id').inTable('apps').onDelete('CASCADE');
      table.string('module_key', 100).notNullable();
      table.boolean('enabled').defaultTo(true);
      table.jsonb('config').defaultTo('{}');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['app_id', 'module_key']);
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('app_modules')
    .dropTableIfExists('ui_configs')
    .dropTableIfExists('table_schemas')
    .dropTableIfExists('apps')
    .dropTableIfExists('users')
    .dropTableIfExists('tenants');
};

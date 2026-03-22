/**
 * Field type definitions shared between client and server
 */
const FIELD_TYPES = {
  TEXT:      { label: 'Text',      sqlType: 'TEXT',          inputType: 'text' },
  INTEGER:  { label: 'Integer',   sqlType: 'INTEGER',       inputType: 'number' },
  DECIMAL:  { label: 'Decimal',   sqlType: 'DECIMAL(10,2)', inputType: 'number' },
  BOOLEAN:  { label: 'Boolean',   sqlType: 'BOOLEAN',       inputType: 'checkbox' },
  DATE:     { label: 'Date',      sqlType: 'DATE',          inputType: 'date' },
  TIMESTAMP:{ label: 'Timestamp', sqlType: 'TIMESTAMPTZ',   inputType: 'datetime-local' },
  JSONB:    { label: 'JSON',      sqlType: 'JSONB',         inputType: 'textarea' },
};

const COMPONENT_TYPES = {
  STAT_CARD:  { label: 'Stat Card',  icon: 'pie-chart' },
  DATA_TABLE: { label: 'Data Table', icon: 'list' },
  FORM:       { label: 'Form',       icon: 'square' },
  BUTTON:     { label: 'Button',     icon: 'grid' },
  TEXT:       { label: 'Text Block', icon: 'type' },
  CHART:      { label: 'Chart',      icon: 'bar-chart' },
};

/**
 * Validate a name (table name, field name)
 */
function isValidName(name) {
  return /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(name);
}

module.exports = { FIELD_TYPES, COMPONENT_TYPES, isValidName };

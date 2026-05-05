const entryProperties = {
  type: { type: 'string', enum: ['income', 'expense'] },
  amount: { type: 'number', exclusiveMinimum: 0 },
  date: { type: 'string', format: 'date' },
  category: { type: 'string', minLength: 1, maxLength: 128 },
  description: { type: 'string', maxLength: 512 }
};

module.exports = {
  createEntry: {
    $id: 'createEntry',
    type: 'object',
    properties: entryProperties,
    required: ['type', 'amount', 'date', 'category'],
    additionalProperties: false
  },
  updateEntry: {
    $id: 'updateEntry',
    type: 'object',
    properties: entryProperties,
    additionalProperties: false
  }
};

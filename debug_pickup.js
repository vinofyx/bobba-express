const Pickup = require('./server/models/pickup.model');
console.log('Pickup model loaded successfully');
console.log('Pickup schema paths:', Object.keys(Pickup.schema.paths));

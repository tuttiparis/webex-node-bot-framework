/* membership-rules-tests.js
 *
 * A set of tests to validate framework functionality
 * when framework is created using a bot token
 */

const Framework = require('../lib/framework');
const Webex = require('webex');

console.log('************************************');
console.log('* Framework mebership rules tests...');
console.log('************************************\n');


// Initialize the framework and user objects once for all the tests
let framework;
require('dotenv').config();
if ((typeof process.env.BOT_API_TOKEN === 'string') &&
  (typeof process.env.VALID_USER_API_TOKEN === 'string') &&
  (typeof process.env.DISALLOWED_USER_API_TOKEN === 'string') &&
  (typeof process.env.HOSTED_FILE === 'string')) {
  frameworkOptions = { token: process.env.BOT_API_TOKEN };
  if (typeof process.env.INIT_STORAGE === 'string') {
    try {
      frameworkOptions.initBotStorageData = JSON.parse(process.env.INIT_STORAGE);
    } catch (e) {
      console.error(`Unable to parse INIT_STORAGE value:${process.env.INIT_STORAGE}`);
      console.error(`${e.message}`);
      console.error('Make sure to set this to optional environment to a ' +
        'properly stringified JSON object in order to test that the storage adapter properly adds it to new bots.');
      process.exit(-1);
    }
  }
  frameworkOptions.restrictToEmailDomains = 'gmail.com';
  framework = new Framework(frameworkOptions);
  validUserWebex = new Webex({ credentials: process.env.VALID_USER_API_TOKEN });
  disallowedUserWebex = new Webex({ credentials: process.env.DISALLOWED_USER_API_TOKEN });
} else {
  console.error('Missing required environment variables:\n' +
    '- BOT_API_TOKEN -- token associatd with an existing bot\n' +
    '- VALID_USER_API_TOKEN -- token associated with an existing user with an allowed domain\n' +
    '- DISSALOWED_USER_API_TOKEN -- valid token associated with an existing user with an allowed domain\n' +
    '- HOSTED_FILE -- url to a file that can be attached to test messages\n' +
    'The tests will create a new space with the bot and the user');
  process.exit(-1);
}

// Load the common module which includes functions and variables
// shared by multiple tests
var common = require("./common/common");
common.setFramework(framework);
common.setUser(validUserWebex);
common.setDisallowedUser(disallowedUserWebex);

//require('./common/invalid-config-tests.js');

// Start up an instance of framework that we will use across multiple tests
describe('#framework', () => {
  // Validate that the invalid user token is good
  before(() => disallowedUserWebex.people.get('me')
    .then((person) => {
      common.setDisallowedUserPerson(person);
    })
    .catch((e) => {
      console.error(`Could not initialize user with DISSALOWED_USER_API_TOKEN: ${e.message}`);
      return(e);
    }));

  // Validate that framework starts and that we have a valid users
  before(() => common.initFramework('framework init', framework, validUserWebex));

  //Stop framework to shut down the event listeners
  after(() => common.stopFramework('shutdown framework', framework));

  // Test bot interactions in a bot created test space
  // That does and doesn't include dissallowed members
  require('./common/bot-membership-rules-tests.js');

  // Test bot interactions in a user created test space
  // With no disallowed members -- make sure nothing breaks in this mode
  //require('./common/bot-created-room-tests.js');

  // Test bot's membership functions
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function () {
  framework.debug('stoppping...');
  framework.stop().then(function () {
    process.exit();
  });
});

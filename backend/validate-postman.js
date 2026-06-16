const fs = require('fs');

const data = JSON.parse(fs.readFileSync('Square_Finance.postman_collection.json', 'utf8'));

const errors = [];

const folders = data.item;
const expectedFolders = ['Monthly Loans', 'Weekly Loans', 'Daily Loans', 'Interest Loans'];

folders.forEach(folder => {
  if (!expectedFolders.includes(folder.name)) return;
  console.log(`\nChecking Folder: ${folder.name}`);

  folder.item.forEach(reqItem => {
    const apiName = reqItem.name;
    let reqBody = {};
    if (reqItem.request.body && reqItem.request.body.raw) {
      reqBody = JSON.parse(reqItem.request.body.raw);
    }
    
    let resBody = {};
    if (reqItem.response && reqItem.response.length > 0 && reqItem.response[0].body) {
      resBody = JSON.parse(reqItem.response[0].body);
    }

    console.log(`  - Validating ${apiName}...`);

    // Check Weekly and Daily Loans
    if (folder.name === 'Weekly Loans' || folder.name === 'Daily Loans') {
      if (reqBody.vehicleInformation) errors.push(`${apiName} in ${folder.name} HAS vehicleInformation in Request`);
      if (resBody.data && resBody.data.vehicleInformation) errors.push(`${apiName} in ${folder.name} HAS vehicleInformation in Response`);
      if (resBody.data && Array.isArray(resBody.data.data) && resBody.data.data.some(d => d.vehicleInformation)) {
         errors.push(`${apiName} in ${folder.name} HAS vehicleInformation in GET Array Response`);
      }
    }

    // Check Monthly Loans
    if (folder.name === 'Monthly Loans') {
      if ((apiName.includes('Create') || apiName.includes('Update')) && reqItem.request.method !== 'GET') {
         if (!reqBody.vehicleInformation && apiName.includes('Create')) errors.push(`${apiName} in Monthly Loans is MISSING vehicleInformation in Request`);
      }
      if (resBody.data && !resBody.data.vehicleInformation && !Array.isArray(resBody.data.data)) {
        errors.push(`${apiName} in Monthly Loans is MISSING vehicleInformation in Response`);
      }
    }

    // Check Interest Loans
    if (folder.name === 'Interest Loans') {
      if (reqBody.vehicleInformation) errors.push(`${apiName} in Interest Loans HAS vehicleInformation in Request`);
      if (resBody.data && resBody.data.vehicleInformation) errors.push(`${apiName} in Interest Loans HAS vehicleInformation in Response`);
      
      if ((apiName.includes('Create') || apiName.includes('Update')) && reqItem.request.method !== 'GET') {
         if (!reqBody.pledgeInformation && apiName.includes('Create')) errors.push(`${apiName} in Interest Loans is MISSING pledgeInformation in Request`);
      }
      if (resBody.data && !resBody.data.pledgeInformation && !Array.isArray(resBody.data.data)) {
         errors.push(`${apiName} in Interest Loans is MISSING pledgeInformation in Response`);
      }
    }
  });
});

if (errors.length > 0) {
  console.error('\n❌ VALIDATION FAILED!');
  errors.forEach(e => console.error(e));
} else {
  console.log('\n✅ VALIDATION PASSED! ALL 100% PERFECT.');
}

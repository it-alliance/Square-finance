import fs from 'fs';
import path from 'path';

const postmanPath = path.join(__dirname, 'Square_Finance.postman_collection.json');
const postmanData = JSON.parse(fs.readFileSync(postmanPath, 'utf8'));

const authHeaderTemplate = {
  key: "Authorization",
  value: "Bearer {{token}}",
  type: "text"
};

// Target folders
const targetFolders = ["Weekly Loans", "Daily Loans"];

function processItem(item: any) {
  if (item.item) {
    // Check if this is a target folder or a subfolder of a target folder
    const isTarget = targetFolders.includes(item.name);
    item.item.forEach((subItem: any) => {
      // Pass a flag if we are inside a target folder
      subItem._isTarget = item._isTarget || isTarget;
      processItem(subItem);
    });
  } else if (item.request && item._isTarget) {
    // 1. Add Auth Header
    if (!item.request.header) {
      item.request.header = [];
    }
    const hasAuth = item.request.header.some((h: any) => h.key === 'Authorization');
    if (!hasAuth) {
      item.request.header.push(authHeaderTemplate);
    }

    // 2. Update Get URLs to use page/limit instead of cursor
    if (item.request.method === 'GET' && item.request.url && Array.isArray(item.request.url.query)) {
      item.request.url.query = [
        { key: "page", value: "1" },
        { key: "limit", value: "10" }
      ];
    }

    // 3. Update Success Examples to match new structured JSON blueprint
    if (item.response && Array.isArray(item.response)) {
      item.response.forEach((resp: any) => {
        if (resp.name.includes('Success')) {
          try {
            const body = JSON.parse(resp.body);

            // If it's a GET request, structure the pagination
            if (item.request.method === 'GET') {
              if (body.data && !body.data.items) {
                // Determine module type from request URL
                const isWeekly = item.request.url.raw.includes('weekly');
                const loanType = isWeekly ? 'Weekly' : 'Daily';
                
                resp.body = JSON.stringify({
                  status: "success",
                  message: `${loanType} loans fetched successfully`,
                  data: {
                    data: Array.isArray(body.data) ? body.data : [],
                    items: 1,
                    limit: 10,
                    "current page": 1,
                    "total number of pages": 1
                  }
                }, null, 2);
              }
            } 
            // If it's POST/PUT/DELETE
            else {
               // Update message if not present
               if (!body.message) {
                 let action = "processed";
                 if (item.request.method === 'POST') action = "created";
                 if (item.request.method === 'PUT') action = "updated";
                 if (item.request.method === 'DELETE') action = "deleted";
                 
                 const isWeekly = item.request.url?.raw?.includes('weekly') || item.name.toLowerCase().includes('weekly');
                 const typeStr = isWeekly ? 'Weekly' : 'Daily';
                 
                 body.message = `${typeStr} loan ${action} successfully`;
                 
                 // If data object exists, ensure it's structured properly
                 if (body.data && !body.data.loanTerms) {
                   // Mock up a massive object similar to what backend actually generates
                   body.data = {
                     id: "fake-id",
                     customerDetails: {
                       customerName: "Mock User",
                       address: "Mock Address",
                       ownRent: "Own",
                       mobileNumbers: ["9999999999"],
                       panNumber: "",
                       aadharNumber: "",
                       guarantorName: "",
                       guarantorMobileNumbers: []
                     },
                     loanTerms: {
                       loanNumber: `L-MOCK`,
                       principalAmount: 100000,
                       processingFeeRate: 2,
                       processingFee: 2000,
                       tenureMonths: 12,
                       tenureType: typeStr,
                       annualInterestRate: 15,
                       dateLoanDisbursed: new Date().toISOString(),
                       emiStartDate: new Date().toISOString(),
                       emiEndDate: new Date().toISOString(),
                       monthlyEMI: isWeekly ? 2500 : 300,
                       totalInterestAmount: 20000,
                       paymentMode: "Cash",
                       chequeNumber: "",
                       disbursement: []
                     },
                     vehicleInformation: {
                       vehicleNumber: "", chassisNumber: "", engineNumber: "", modelYear: 2024, typeOfVehicle: "Unknown",
                       ywBoard: "Unknown", dealerName: "", dealerNumber: "", fcDate: "", insuranceDate: "", rtoWorkPending: [], hpEntry: "Not Done"
                     },
                     status: {
                       status: "Active", paymentStatus: "Pending", isSeized: false, docChecklist: "", remarks: "",
                       createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                     }
                   };
                 }
                 resp.body = JSON.stringify(body, null, 2);
               }
            }
          } catch (e) {} // Skip if not valid JSON
        }
      });
    }
  }
}

postmanData.item.forEach((item: any) => processItem(item));

fs.writeFileSync(postmanPath, JSON.stringify(postmanData, null, 2));
console.log("✅ Postman collection successfully updated with Auth Headers and formatted responses for Weekly & Daily loans.");

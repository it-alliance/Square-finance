import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4000/api';
const postmanPath = path.join(__dirname, 'Square_Finance.postman_collection.json');

async function syncPostmanWithLiveBackend() {
  console.log("Synchronizing Postman Collection with Live Backend Data...");
  
  // 1. Get Token
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: "superadmin@squarefinance.com", password: "Admin@1234" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const liveData: any = {};

  const modules = [
    { name: "Monthly Loans", endpoint: "monthly-loans", tKey: "tenureMonths", tVal: 12 },
    { name: "Weekly Loans", endpoint: "weekly-loans", tKey: "tenureWeeks", tVal: 52 },
    { name: "Daily Loans", endpoint: "daily-loans", tKey: "tenureMonths", tVal: 100 },
    { name: "Interest Loans", endpoint: "interest-loans", tKey: "interestRate", tVal: 2 }
  ];

  // 2. Gather Live Responses
  for (const mod of modules) {
    liveData[mod.name] = {};
    const payload: any = {
      customerDetails: {
        customerName: `Live ${mod.name} User`,
        address: "123 API St",
        ownRent: "Own",
        mobileNumbers: ["9999999999"],
        panNumber: "ABCDE1234F",
        aadharNumber: "123456789012"
      },
      loanTerms: {
        loanNumber: `${mod.name.substring(0,1)}L-LIVE-${Date.now()}`,
        principalAmount: 150000,
        processingFeeRate: 2,
        annualInterestRate: 14,
        paymentMode: "Cash"
      },
      vehicleInformation: {
        vehicleNumber: "KA-01-AB-1234",
        chassisNumber: "CHAS123456789",
        engineNumber: "ENG123456789",
        modelYear: 2023,
        typeOfVehicle: "Car",
        ywBoard: "Yellow",
        hpEntry: "Pending"
      },
      status: {
        status: "Active",
        nextFollowUpDate: new Date(Date.now() + 86400000).toISOString(),
        clientResponse: "Will pay soon"
      }
    };
    
    if (mod.name === "Interest Loans") {
      delete payload.vehicleInformation;
      payload.pledgeInformation = {
        pledgeDetails: "Property Papers for Site #123"
      };
      payload.loanTerms.interestRate = 2;
    } else {
      payload.loanTerms[mod.tKey] = mod.tVal;
    }

    // Create
    liveData[mod.name].createPayload = payload;
    const cRes = await fetch(`${BASE_URL}/${mod.endpoint}`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const cData = await cRes.json();
    liveData[mod.name].createResponse = cData;
    const loanId = cData?.data?.id;

    // Get
    const gRes = await fetch(`${BASE_URL}/${mod.endpoint}?page=1&limit=5`, { headers });
    liveData[mod.name].getResponse = await gRes.json();

    // Update
    const uPayload = { loanTerms: { principalAmount: 200000 } };
    liveData[mod.name].updatePayload = uPayload;
    if (loanId) {
      const uRes = await fetch(`${BASE_URL}/${mod.endpoint}/${loanId}`, { method: 'PUT', headers, body: JSON.stringify(uPayload) });
      liveData[mod.name].updateResponse = await uRes.json();

      // Delete
      const dRes = await fetch(`${BASE_URL}/${mod.endpoint}/${loanId}`, { method: 'DELETE', headers });
      liveData[mod.name].deleteResponse = await dRes.json();
    }
  }

  // 3. Mutate Postman File
  const postmanData = JSON.parse(fs.readFileSync(postmanPath, 'utf8'));

  const authHeader = { key: "Authorization", value: "Bearer {{token}}", type: "text" };

  function traverse(item: any, currentFolder: string) {
    if (item.name) {
      if (modules.some(m => m.name === item.name)) currentFolder = item.name;
    }

    if (item.item) {
      item.item.forEach((subItem: any) => traverse(subItem, currentFolder));
    } else if (item.request) {
      // Add Auth Header everywhere
      if (!item.request.header) item.request.header = [];
      if (!item.request.header.some((h: any) => h.key === 'Authorization')) {
        item.request.header.push(authHeader);
      }

      if (currentFolder && liveData[currentFolder]) {
        const live = liveData[currentFolder];
        const reqName = item.name.toLowerCase();

        // Overwrite Request Bodys
        if (reqName.includes("create")) {
          item.request.body.raw = JSON.stringify(live.createPayload, null, 2);
        } else if (reqName.includes("edit") || reqName.includes("update")) {
          item.request.body.raw = JSON.stringify(live.updatePayload, null, 2);
        }

        // Overwrite Responses
        if (item.response && Array.isArray(item.response)) {
          item.response.forEach((resp: any) => {
            if (resp.name.includes("Success")) {
              if (reqName.includes("create")) resp.body = JSON.stringify(live.createResponse, null, 2);
              else if (reqName.includes("get")) {
                item.request.url.query = [{ key: "page", value: "1" }, { key: "limit", value: "10" }];
                resp.body = JSON.stringify(live.getResponse, null, 2);
              }
              else if (reqName.includes("edit") || reqName.includes("update")) resp.body = JSON.stringify(live.updateResponse, null, 2);
              else if (reqName.includes("delete")) resp.body = JSON.stringify(live.deleteResponse, null, 2);
            }
          });
        }
      }
    }
  }

  // 2.5 Ensure "Interest Loans" exists by cloning "Monthly Loans" inside the "Loans" folder
  const loansFolder = postmanData.item.find((i: any) => i.name === "Loans");
  if (loansFolder && loansFolder.item) {
    const hasInterestLoans = loansFolder.item.some((i: any) => i.name === "Interest Loans");
    if (!hasInterestLoans) {
      const monthlyFolder = loansFolder.item.find((i: any) => i.name === "Monthly Loans");
      if (monthlyFolder) {
        const interestFolder = JSON.parse(JSON.stringify(monthlyFolder));
        interestFolder.name = "Interest Loans";
        
        const replaceUrl = (item: any) => {
          if (item.request && item.request.url) {
            if (Array.isArray(item.request.url.path)) {
              item.request.url.path = item.request.url.path.map((p: string) => p === "monthly-loans" ? "interest-loans" : p);
            }
            if (item.request.url.raw) {
              item.request.url.raw = item.request.url.raw.replace("monthly-loans", "interest-loans");
            }
          }
          if (item.item) item.item.forEach(replaceUrl);
        };
        replaceUrl(interestFolder);
        loansFolder.item.push(interestFolder);
      }
    }
  }

  postmanData.item.forEach((item: any) => traverse(item, ""));
  fs.writeFileSync(postmanPath, JSON.stringify(postmanData, null, 2));
  console.log("✅ Postman Collection rewritten with 100% REAL live API responses.");
}

syncPostmanWithLiveBackend().catch(console.error);

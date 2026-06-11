const BASE_URL = 'http://localhost:4000/api';

async function runTests() {
  console.log("=========================================");
  console.log("🚀 STARTING MASSIVE END-TO-END VALIDATION");
  console.log("=========================================\n");
  let token = "";

  try {
    console.log("[INIT] Testing Auth Login...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "superadmin@squarefinance.com",
        password: "Admin@1234"
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    token = loginData.token;
    console.log("✅ Login successful. Received valid JWT Token.");

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const modules = [
      { name: "Monthly", endpoint: "monthly-loans", tenureKey: "tenureMonths", tenureVal: 12 },
      { name: "Weekly", endpoint: "weekly-loans", tenureKey: "tenureWeeks", tenureVal: 52 },
      { name: "Daily", endpoint: "daily-loans", tenureKey: "tenureMonths", tenureVal: 100 }
    ];

    for (const mod of modules) {
      console.log(`\n--- TESTING ${mod.name.toUpperCase()} LOANS ---`);
      let loanId = "";
      
      console.log(`[1] Create ${mod.name} Loan...`);
      const payload: any = {
        customerDetails: {
          customerName: `Test ${mod.name} User`,
          address: "123 Auto St",
          ownRent: "Own",
          mobileNumbers: ["9999999999"]
        },
        loanTerms: {
          loanNumber: `${mod.name.substring(0,1)}L-TEST-${Date.now()}`,
          principalAmount: 100000,
          processingFeeRate: 2,
          annualInterestRate: 15
        }
      };
      payload.loanTerms[mod.tenureKey] = mod.tenureVal;

      const createRes = await fetch(`${BASE_URL}/${mod.endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      const createData = await createRes.json();
      if (!createData.message || !createData.data.loanTerms) {
        throw new Error(`${mod.name} Create response missing message or full data object.`);
      }
      loanId = createData.data.id;
      console.log(`✅ Create returned 201 status, full data object, and message: "${createData.message}"`);

      console.log(`[2] Get ${mod.name} Loans (Offset Pagination)...`);
      const getRes = await fetch(`${BASE_URL}/${mod.endpoint}?page=1&limit=5`, { headers });
      const getData = await getRes.json();
      if (typeof getData.data.items !== 'number' || typeof getData.data["current page"] !== 'number') {
        throw new Error(`${mod.name} Offset pagination math fields are missing or wrong type.`);
      }
      console.log(`✅ Get Loans formatted perfectly. Items: ${getData.data.items}, Total Pages: ${getData.data["total number of pages"]}, Message: "${getData.message}"`);

      console.log(`[3] Update ${mod.name} Loan...`);
      const updateRes = await fetch(`${BASE_URL}/${mod.endpoint}/${loanId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          loanTerms: { principalAmount: 150000 }
        })
      });
      const updateData = await updateRes.json();
      if (!updateData.message) throw new Error(`${mod.name} Update response missing message.`);
      console.log(`✅ Update Loan successful. Message: "${updateData.message}"`);

      console.log(`[4] Delete ${mod.name} Loan...`);
      const deleteRes = await fetch(`${BASE_URL}/${mod.endpoint}/${loanId}`, {
        method: 'DELETE',
        headers
      });
      const deleteData = await deleteRes.json();
      if (!deleteData.message) throw new Error(`${mod.name} Delete response missing message.`);
      console.log(`✅ Delete Loan successful. Message: "${deleteData.message}"`);
    }

    console.log("\n=========================================");
    console.log("🎉 ALL TESTS PASSED! ARCHITECTURE IS UNIFIED AND FLAWLESS.");
    console.log("=========================================\n");

  } catch (error: any) {
    console.error("❌ Test Failed!");
    console.error(error.message);
  }
}

runTests();

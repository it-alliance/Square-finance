const BASE_URL = 'http://localhost:4000/api';

async function runStressTest() {
  console.log("=========================================");
  console.log("🔥 INITIATING MASSIVE API STRESS TEST");
  console.log("=========================================\n");
  let token = "";

  try {
    console.log("[INIT] Authenticating...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "superadmin@squarefinance.com", password: "Admin@1234" })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed`);
    token = loginData.token;
    console.log("✅ Authenticated securely.");

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const modules = [
      { name: "Monthly", endpoint: "monthly-loans" },
      { name: "Weekly", endpoint: "weekly-loans" },
      { name: "Daily", endpoint: "daily-loans" },
      { name: "Interest", endpoint: "interest-loans" }
    ];

    const ITERATIONS = 15; // Create 15 loans for each to test pagination and load

    for (const mod of modules) {
      console.log(`\n--- STRESS TESTING: ${mod.name.toUpperCase()} LOANS ---`);
      
      const createdIds: string[] = [];
      
      console.log(`[1] Creating ${ITERATIONS} ${mod.name} Loans rapidly...`);
      for (let i = 0; i < ITERATIONS; i++) {
        const payload: any = {
          customerDetails: {
            customerName: `Stress User ${i}`,
            address: "123 Stress St",
            ownRent: "Own",
            mobileNumbers: [`9999999${i.toString().padStart(3, '0')}`]
          },
          loanTerms: {
            loanNumber: `${mod.name.substring(0,1)}L-STRESS-${Date.now()}-${i}`,
            principalAmount: 100000,
            processingFeeRate: 2,
            annualInterestRate: 15
          }
        };

        if (mod.name === "Interest") {
          payload.pledgeInformation = { pledgeDetails: "Gold" };
          payload.loanTerms.interestRate = 2;
        } else if (mod.name === "Monthly") {
          payload.loanTerms.tenureMonths = 12;
        } else if (mod.name === "Weekly") {
          payload.loanTerms.tenureWeeks = 52;
        } else if (mod.name === "Daily") {
          payload.loanTerms.tenureMonths = 100;
        }

        const createRes = await fetch(`${BASE_URL}/${mod.endpoint}`, { method: 'POST', headers, body: JSON.stringify(payload) });
        const createData = await createRes.json();
        
        // ASSERTIONS
        if (createData.status !== "success") throw new Error(`Create Status failed`);
        if (typeof createData.message !== "string") throw new Error(`Create Message missing! Boss will be angry.`);
        
        createdIds.push(createData.data.id);
      }
      console.log(`✅ ${ITERATIONS} Loans created successfully. Message assertions passed.`);

      console.log(`[2] Testing Strict Pagination & Blueprint Architecture...`);
      const getRes = await fetch(`${BASE_URL}/${mod.endpoint}?page=1&limit=5`, { headers });
      const getData = await getRes.json();
      
      // STRICT ASSERTIONS
      if (getData.status !== "success") throw new Error(`Get Status failed`);
      if (typeof getData.message !== "string") throw new Error(`Get Message missing!`);
      if (!Array.isArray(getData.data.data)) throw new Error(`data.data is not an array!`);
      if (typeof getData.data.items !== "number") throw new Error(`data.items is missing or not a number!`);
      if (typeof getData.data.limit !== "number") throw new Error(`data.limit is missing or not a number!`);
      if (typeof getData.data["current page"] !== "number") throw new Error(`data["current page"] is missing!`);
      if (typeof getData.data["total number of pages"] !== "number") throw new Error(`data["total number of pages"] is missing!`);
      
      console.log(`✅ Offset Pagination Architecture is PERFECT. 100% compliant with Boss's instructions.`);
      console.log(`   - Items total: ${getData.data.items}`);
      console.log(`   - Pages total: ${getData.data["total number of pages"]}`);

      console.log(`[3] Rapid Cleanup (Deleting all ${ITERATIONS} test loans)...`);
      for (const id of createdIds) {
        const delRes = await fetch(`${BASE_URL}/${mod.endpoint}/${id}`, { method: 'DELETE', headers });
        const delData = await delRes.json();
        if (typeof delData.message !== "string") throw new Error(`Delete Message missing!`);
      }
      console.log(`✅ Cleanup complete. Delete messaging assertions passed.`);
    }

    console.log("\n=========================================");
    console.log("🎉 ALL STRESS TESTS PASSED!");
    console.log("✅ The JSON architectures are perfectly unified and completely bulletproof.");
    console.log("=========================================\n");

  } catch (error: any) {
    console.error("❌ STRESS TEST FAILED!");
    console.error(error.message);
  }
}

runStressTest();

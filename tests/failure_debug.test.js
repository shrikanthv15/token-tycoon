const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8000');
  // speed up
  await page.evaluate(() => { __tt.scene.S.speed = 2; });
  // buy subscription and hire a model
  await page.evaluate(() => { __tt.buySub('claude'); __tt.hire('haiku'); });
  // spawn a high-star job (3 stars) to increase failure chance
  await page.evaluate(() => { __tt.spawnJob(3, 5); });
  // assign job to the first staffer
  await page.evaluate(() => {
    const staff = __tt.state.staff[0];
    const jobId = __tt.state.jobs[0].id;
    const deskIdx = staff.desk.idx;
    __tt.assign(jobId, deskIdx);
  });
  // wait for the job to finish (max 5 seconds)
  await page.waitForTimeout(5000);
  // check that a failure marker was created and debug handler attached
  const hasDebug = await page.evaluate(() => {
    const staff = __tt.state.staff[0];
    return !!staff.debugHandler && !!staff.failMarker;
  });
  if (!hasDebug) {
    console.error('Failure marker or debug handler missing');
    process.exit(1);
  }
  // invoke debug handler to open modal
  await page.evaluate(() => { __tt.state.staff[0].debugHandler(); });
  // verify modal container (depth 81) exists
  const modalExists = await page.evaluate(() => {
    return __tt.scene.children.list.some(c => c.depth === 81);
  });
  if (!modalExists) {
    console.error('Debug modal not opened');
    process.exit(1);
  }
  await browser.close();
  console.log('Failure debug test passed');
  process.exit(0);
})();

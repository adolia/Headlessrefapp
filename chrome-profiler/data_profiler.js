const fs = require('fs');
const chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const cdp = require('chrome-remote-interface');

const sleep = n => new Promise(resolve => setTimeout(resolve, n));
const url = 'http://localhost:9000';

(async function() {
  const chrome = await puppeteer.launch();;
  const client = await cdp();

    try {
        const {Network, Profiler, Memory, Page, Runtime} = client;
        // enable domains to get events.
        await Page.enable();
        await Network.enable();
        await Profiler.enable();
        await Memory.enable();

        // Set JS profiler sampling resolution to 100 microsecond (default is 1000)
        await Profiler.setSamplingInterval({interval: 100});

        await Page.navigate({url});
        await client.on('Page.loadEventFired', async _ => {
          // on load we'll start profiling, kick off the test, and finish
          await Profiler.start();
          await Memory.startSampling({samplingInterval: 100});

          await Runtime.evaluate({expression: 'startTest();'});
          await sleep(600);
          const cpu_data = await Profiler.stop();
          await Memory.stopSampling();
          const mem_data = await Memory.getSamplingProfile();

          saveProfiles(cpu_data, "cpu");
        });
    } catch (err) {
        console.error(err);
    } finally {
        exit()
    }

  async function saveProfile(data, type) {
    // data.profile described here: https://chromedevtools.github.io/devtools-protocol/tot/Profiler/#type-Profile
    // Process the data however you wish… or,
    // Use the JSON file, open Chrome DevTools, Menu, More Tools, JavaScript Profiler, `load`, view in the UI
    const profile= `profiling-data/${type}profile-${Date.now()}.json`;
    const string = JSON.stringify(data.profile, null, 4);
    fs.writeFileSync(profile, string);
    console.log('Done! Profile data saved to:', profile);

  }
  // exit from profiling script
  async function exit() {
    console.log('Exit from profiling!');
    await client.close();
    await chrome.kill();
  }

})();
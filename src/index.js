async function runProfiler(numberOfTimes, limit) {
    const mongoose = require('mongoose');
    const TitleModel = require('./title.model');

    const mongodb = "mongodb://root:root@localhost/imdb?authSource=admin"

    mongoose.connection.once('open', function () {console.log('connected to mongoDB');});

    await mongoose.connect(mongodb, {useNewUrlParser: true})
    mongoose.Promise = global.Promise;

    const Title = mongoose.model('title_basic', TitleModel);

    async function runQuery(limit, lean) {
        const start = Date.now();
        await Title.find(null, null, {limit}).lean(lean).exec();
        const stop = Date.now();
        const took = stop - start;
        console.log(`Limit: ${limit} \t Lean: ${JSON.stringify(lean)} \t Took: ${took}`);

        return took;
    }

    let results = [];

    for (let i = 1; i <= numberOfTimes; i++) {
        const leanModeOn = await runQuery(limit, true);
        const leanModeOnWithVirtuals = await runQuery(limit, {virtuals: true});
        const leanModeOff = await runQuery(limit, false);

        results.push( [leanModeOn, leanModeOnWithVirtuals, leanModeOff]);
    }

    const reducer = function(acc, x){return acc+x};
    const leanModeOnAverage = results.map(function(x){return x[0]}).reduce(reducer) / results.length;
    const leanModeOnWithVirtualsAverage = results.map(function(x){return x[1]}).reduce(reducer) / results.length;
    const leanModeOffAverage = results.map(function(x){return x[2]}).reduce(reducer) / results.length;
    
    console.log(`
    Average Runtime With Lean Mode On: ${leanModeOnAverage} 
    Average Runtime With Lean Mode On with Virtuals: ${leanModeOnWithVirtualsAverage} 
    Average Runtime With Lean Mode Off: ${leanModeOffAverage}`);
}

runProfiler(10, 1000000);

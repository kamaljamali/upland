const axios = require("axios");
const qs = require("qs");

function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function getAreaData(north, south, east, west, price, fsa_allow, status) {
    const visitedProps = {};
    const url = `https://api.upland.me/map?north=${north}&south=${south}&east=${east}&west=${west}&marker=false`;
    console.log("\n\nSEARCH URL", url);

    let data = (await axios.get(url)).data;

    /* Filter data */
    console.log("Results: ", data.length, fsa_allow, status);
    NA = data
        .filter((x) => x.status == "Locked")
        .filter((x) => !visitedProps[x.prop_id]);
    console.log("Not Available: ", NA.length);

    data = data
        .filter((x) => x.status == status)
        .filter((x) => !visitedProps[x.prop_id]);
    console.log("Unlocked Results: ", data.length);

    // return data.length > 0 ? await getPropData(data, price, visitedProps) : [];
}

async function getPropData(props, price, visitedProps) {
    const requests = props.map((x) =>
        axios.get(`https://api.upland.me/properties/${x.prop_id}`)
    );

    /* Get request */
    let founded = await Promise.allSettled(requests);

    /* Mark a visited */
    return founded
        .filter((res) => {
            const data = res.value.data;
            visitedProps[data.prop_id] = true;

            return +data.price <= +price;
        })
        .map((x) => x.value.data);
}

async function start() {
    /* Get from args */
    let [price, fsa_allow, status, url] = process.argv.splice(2, 4);
    let { north, south, east, west } = qs.parse(
        url.replace(
            "https://api.upland.me/map?",
            "https://api.upland.me/map?t=10&"
        )
    );

    fsa_allow = fsa_allow == "true";
    const incNS = 0.026379632;
    const incEW = 0.012553589;

    // const difNS = north - south;
    // const difEW = east - west;
    // const countSepNS = Math.floor(Math.abs(difNS / NSSEPERATOR)) + 1;
    // const countSepEW = Math.floor(Math.abs(difEW / EWSEPERATOR)) + 1;

    const totalResult = [];
    for (let i = parseFloat(south); i <= parseFloat(north); i += incNS) {
        for (let j = parseFloat(west); j <= parseFloat(east); j += incEW) {
            console.log(
                "North : ",
                i + incNS,
                "South : ",
                i,
                "East : ",
                j + incEW,
                "West : ",
                j
            );
            const result =
                (await getAreaData(
                    i + incNS,
                    i,
                    j + incEW,
                    j,
                    parseFloat(+price),
                    fsa_allow,
                    status
                )) || [];
            console.log("\n\nITERATION " + i + " " + j, result);

            totalResult.push(...result);
            await delay(2000);
        }
    }

    return totalResult;
}

start().then(console.log).catch(console.error);

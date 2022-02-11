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
    console.log("Filtered Results: ", data.length);

    return data.length > 0 ? await getPropData(data, price, visitedProps) : [];
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
    let Fnorth = +north;
    let Fsouth = +south;

    const totalResult = [];
    const step = 5 / 1000;
    for (let i = 0; i < 40; i++) {
        east = +east + step;
        west = +west + step;
        north = Fnorth;
        south = Fsouth;

        for (let j = 0; j < 10; j++) {
            north = +north + step;
            south = +south + step;

            // console.log(
            //     "SEARCHIN IN : ",
            //     north,
            //     south,
            //     east,
            //     west,
            //     +price,
            //     fsa_allow,
            //     status
            // );
            const result =
                (await getAreaData(
                    north,
                    south,
                    east,
                    west,
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

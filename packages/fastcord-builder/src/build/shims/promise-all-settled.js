const allSettledFulfill = value => ({ status: "fulfilled", value });
const allSettledReject = reason => ({ status: "rejected", reason });
const mapAllSettled = item => Promise.resolve(item).then(allSettledFulfill, allSettledReject);

const allSettled = Promise.allSettled ??= iterator => {
    return Promise.all(Array.from(iterator).map(mapAllSettled));
};

// Your editor may yell at you for this, but this is alright! It's a valid JS syntax
export { allSettled as "Promise.allSettled" };

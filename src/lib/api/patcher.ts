const {
    after: _after,
    before: _before,
    instead: _instead
} = require("spitroast");

/** @internal */
export const _patcherDelaySymbol = Symbol.for("fastcord.api.patcher.delay");

type Unpatcher = () => boolean;
type DelayCallback = (callback: (target: any) => void) => unknown;
type Thenable = { then: typeof Promise.prototype.then };

interface PatchFn<Callback> {
    (func: string, parent: any, callback: Callback, once?: boolean): Unpatcher;
    await(func: string, parent: Promise<unknown>, callback: Callback, once?: boolean): Unpatcher;
}

type BeforeFn = PatchFn<(args: any[]) => unknown | unknown[]>;
type InsteadFn = PatchFn<(args: any[], origFunc: Function) => unknown>;
type AfterFn = PatchFn<(args: any[], ret: any) => unknown>;

function create(fn: Function) {
    function patchFn(this: any, ...args: any[]) {
        if (_patcherDelaySymbol in args[1]) {
            const delayCallback: DelayCallback = args[1][_patcherDelaySymbol];

            let cancel = false;
            let unpatch = () => cancel = true;

            delayCallback(target => {
                if (cancel) return;
                args[1] = target;
                unpatch = fn.apply(this, args);
            });

            return () => unpatch();
        }

        return fn.apply(this, args);
    }

    function promisePatchFn(this: any, ...args: [any, Thenable, ...any]) {
        const thenable = args[1];
        if (!thenable || !("then" in thenable)) throw new Error("target is not a then-able object");

        let cancel = false;
        let unpatch = () => cancel = true;

        thenable.then(target => {
            if (cancel) return;
            args[1] = target;
            unpatch = patchFn.apply(this, args);
        });

        return () => unpatch();
    }

    return Object.assign(patchFn, { await: promisePatchFn });
}

export const after = create(_after) as AfterFn;
export const before = create(_before) as BeforeFn;
export const instead = create(_instead) as InsteadFn;

/** @internal */
export default { after, before, instead };

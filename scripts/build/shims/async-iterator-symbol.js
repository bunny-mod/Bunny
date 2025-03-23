// babel/swc async generator implementation for some reason does not include assigning Symbol.asyncIterator (and won't work out of the box???)
const asyncIteratorSymbol = Symbol("Symbol.asyncIterator");

// your editor may yell at you for invalid syntax here, but this is a valid JS syntax!
export { asyncIteratorSymbol as "Symbol.asyncIterator" };

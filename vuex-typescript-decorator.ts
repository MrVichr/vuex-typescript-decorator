import * as Vuex from "vuex";

const $vuexts=Symbol("$vuexts");

class PropertyInfo
 {
  propertyKey: string;
  descriptor: PropertyDescriptor;
  public constructor(propertyKey: string, descriptor: PropertyDescriptor)
   {
    this.propertyKey=propertyKey;
    this.descriptor=descriptor;
   }
 }

class GetterInfo extends PropertyInfo { }

class ActionInfo extends PropertyInfo { }

class MutationInfo extends PropertyInfo
 {
  blesk: number;
 }

class HiddenInfo
 {
  propertyKey: string;
  descriptor?: PropertyDescriptor;
  public constructor(propertyKey: string, descriptor?: PropertyDescriptor)
   {
    this.propertyKey=propertyKey;
    this.descriptor=descriptor;
   }
 }


class StoModInfo
 {
  target: any;
  getters: GetterInfo[]=[];
  actions: ActionInfo[]=[];
  mutations: MutationInfo[]=[];
  hiddens: HiddenInfo[]=[];
  public constructor(target: any)
   {
    this.target=target;
   }
 }

var centralStore: StoModInfo[]=[];
function findStoMod(target: any): StoModInfo
 {
  let res=centralStore.find(function(smi: StoModInfo) {return smi.target==target;});
  if (res)
    return res;
  let res2=new StoModInfo(target);
  centralStore.push(res2);
  return res2;
 }

function findStoModC(ctr: Function): StoModInfo|undefined
 {
  return centralStore.find(function(smi: StoModInfo) {return smi.target.constructor==ctr;});
 }

function getter_inner(target: any, propertyKey: string, descriptor: PropertyDescriptor, options?: {hello: string}): PropertyDescriptor
 {
  if (!descriptor)
    throw Error("The Property Descriptor will be undefined if your script target is less than ES5");;
  //console.log('got getter, target=', target, 'prop=', propertyKey, 'descriptor=', descriptor);
  let smi=findStoMod(target);
  //if you use both @getter and get then we're called twice
  if (!smi.getters.find(function(gi) {return gi.propertyKey==propertyKey;}))
    smi.getters.push(new GetterInfo(propertyKey, descriptor));
  if (descriptor.get || descriptor.set) //for get property()...
    return {...descriptor,
      get: function(this: VuextsMixin<any>) //called by user, thinking s/he calls his own method
         {
          let vi=this[$vuexts]; //((this as any).$vuexts as VuextsInfo<any>);
          let key=vi.namespacedKey(propertyKey);
          //console.log("getter_inner/g("+propertyKey+"): this=", this, "key=", key);
          if (vi.store.getters)
            return vi.store.getters[key];
          return undefined;
         }}
  else //for @getter get_property()...
    return {...descriptor,
      value: function(this: VuextsMixin<any>) //called by user, thinking s/he calls his own method
         {
          let vi=this[$vuexts];
          let key=vi.namespacedKey(propertyKey);
          //console.log('getter_inner/v: this=', this, "vi=", vi, "key=", key);
          if (vi.store.getters)
            return vi.store.getters[key];
          return undefined;
         }}
 }

//decorate as @getter or @getter() or @getter({hello: "world"})
function getter(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
function getter(options?: {hello: string}): (target: any, propertyKey: string, descriptor: PropertyDescriptor)=>PropertyDescriptor;
function getter(target: any, propertyKey?: string, descriptor?: PropertyDescriptor)
 {
  if (target && propertyKey && descriptor)
   {
    return getter_inner(target, propertyKey, descriptor, undefined);
   };
  return function(target2: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
   {
    return getter_inner(target2, propertyKey, descriptor, target);
   };
 }

export { getter };

function action_inner(target: any, propertyKey: string, descriptor: PropertyDescriptor, options?: {hello: string}): PropertyDescriptor
 {
  if (!descriptor)
    throw Error("The Property Descriptor will be undefined if your script target is less than ES5");;
  //console.log('got action, target=', target, 'prop=', propertyKey, "options=", options);
  let smi=findStoMod(target);
  smi.actions.push(new ActionInfo(propertyKey, descriptor));
  return {...descriptor,
    value: function(this: VuextsMixin<any>, /*context: null,*/ payload: any) //called by user, thinking s/he calls his own method
       {
        //console.log('action_inner: this=', this);
        let vi=this[$vuexts];
        let result: any=vi.store.dispatch(vi.namespacedKey(propertyKey), payload);
        return result;
       }}
 }

//decorate as @action or @action() or @action({hello: "there"})
function action(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
function action(options?: {hello: string}): (target: any, propertyKey: string, descriptor: PropertyDescriptor)=>PropertyDescriptor;
function action(target: any, propertyKey?: string, descriptor?: PropertyDescriptor)
 {
  if (target && propertyKey && descriptor)
   {
    return action_inner(target, propertyKey, descriptor, undefined);
   };
  return function(target2: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
   {
    return action_inner(target2, propertyKey, descriptor, target);
   };
 }

export { action };

function mutation_inner(target: any, propertyKey: string, descriptor: PropertyDescriptor, options?: {hola: string}): PropertyDescriptor
 {
  if (!descriptor)
    throw Error("The Property Descriptor will be undefined if your script target is less than ES5");;
  //console.log('got mutation, target=', target, 'prop=', propertyKey);
  let smi=findStoMod(target);
  smi.mutations.push(new MutationInfo(propertyKey, descriptor));
  return {...descriptor,
    value: function(this: VuextsMixin<any>, payload: any) //called by user, thinking s/he calls his own method
       {
        //console.log('mutation_inner: this=', this);
        let vi=this[$vuexts];
        let result: any=vi.store.commit(vi.namespacedKey(propertyKey), payload);
        //result==undefined :-(
        return result;
       }};
 }

//decorate as @mutation or @mutation() or @mutation({hola: "ahi"})
function mutation(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
function mutation(options?: {hola: string}): (target: any, propertyKey: string, descriptor: PropertyDescriptor)=>PropertyDescriptor;
function mutation(target: any, propertyKey?: string, descriptor?: PropertyDescriptor)
 {
  if (target && propertyKey && descriptor)
   {
    return mutation_inner(target, propertyKey, descriptor, undefined);
   };
  return function(target2: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor
   {
    return mutation_inner(target2, propertyKey, descriptor, target);
   };
 }

export { mutation };

function hidden_inner(target: any, propertyKey: string, descriptor?: PropertyDescriptor, options?: {hi: string}): PropertyDescriptor
 {
  //oh dear, how do I tell @hidden property from ES<5 ?
  //if (!descriptor)
    //throw Error("The Property Descriptor will be undefined if your script target is less than ES5");;

  //console.log('got mutation, target=', target, 'prop=', propertyKey);
  let smi=findStoMod(target);
  smi.hiddens.push(new HiddenInfo(propertyKey, descriptor));
  return {...descriptor, enumerable: false}; //return value ignored for properties (i.e. not getter+setter)
 }

function hidden(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor; //@hidden get/set
function hidden(target: any, propertyKey: string): void; //@hidden x: number
//function hidden(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
function hidden(options?: {hi: string}): (target: any, propertyKey: string, descriptor?: PropertyDescriptor)=>any;//PropertyDescriptor;
function hidden(options?: {hi: string}): (target: any, propertyKey: string)=>void;
function hidden(target?: any, propertyKey?: string, descriptor?: PropertyDescriptor)
 {
  if (target && propertyKey)
   {
    if (descriptor)
      return hidden_inner(target, propertyKey, descriptor, undefined);
    hidden_inner(target, propertyKey, undefined, undefined);
    return;
    //let target: (new(...args: any[])=>T)=options;
   };
  //throw new Error("frilure");

  return function (target2: any, propertyKey: string, descriptor?: PropertyDescriptor): PropertyDescriptor|void
   {
    let result=hidden_inner(target2, propertyKey, descriptor, target);
    //console.log("Vuexts: hidden factory tg2=", target2, "prop=", propertyKey, "desc=", descriptor, "res=", result);
    if (descriptor)
      return result;
    return; //return value is NOT ignored. Must return undefined.
   };
 }

export { hidden };

class VuextsInfo<T>
 {
  store: Vuex.Store<T>; //"store" Vuex.Store<T> for store, "root" Vuex.Store<any> for module
  module_: T;
  rawmodule: Vuex.Module<T, any>;
  namespace: string[];
  constructor()
   {
   }
  namespacedKey(key: string): string
   {
    if (!this.namespace || (this.namespace.length==0))
      return key;
    else
      return this.namespace.join("/")+"/"+key;
   }
 }

type VuextsMixin<X>=
 {
  [$vuexts]: VuextsInfo<X>;
 }

type Ctor<X> =
 {
  new (...args: any[]): X;
 };

//store and module are pretty similar but not enough to be merged

//see https://stackoverflow.com/questions/49868048/class-decorator-with-generic-parameter
function store_inner<T>(ctr: new(...args: any[])=>T, options?: Vuex.StoreOptions<T>)
 {
  // give a name to the extended T we will return
  /**/
  type XT = T & VuextsMixin<T>;
   /*{
    $vuexts: VuextsInfo<XT>;
   };*/
  /*/
  class XT extends (T as Ctor<any>)
   {
    $vuexts: VuextsInfo<XT>;
   };
  /**/

  
  let orioptions: Vuex.StoreOptions<T>=options || {};
  let smi=findStoModC(ctr);
  //console.log('got @store, ctr=', ctr, 'smi=', smi);
  if (!smi)
   {
    console.error("Vuexts: @store should have at least one @action or @mutation or @getter");
    //return ctr; //should not happen
   };

  //find getters and add them to smi.getters
  //inspired by vue-class-component/lib/component.js#componentFactory
  var proto = ctr.prototype;
  Object.getOwnPropertyNames(proto).forEach(function (key)
   {
    if (key === 'constructor') {
      return;
     }
    // known properties
    if ([""].indexOf(key) > -1) {
      //smi.something = proto[key];
      return;
    }
    var descriptor = Object.getOwnPropertyDescriptor(proto, key);
    //    if (typeof descriptor.value === 'function') {
    //        // methods
    //        (options.methods || (options.methods = {}))[key] = descriptor.value;
    //    }
    //else
    if (smi && descriptor && (descriptor.get || descriptor.set))
     {
      let ishidden=smi.hiddens.find(function(hi: HiddenInfo) {return hi.propertyKey==key;});
      if (!ishidden) //do not convert @hidden getter into Vuex getter
       {
        // computed properties
        let descriptor2=getter_inner(smi.target, key, descriptor);
        Object.defineProperty(proto, key, descriptor2);
       };
     };
   }); 


  //replace constructor to add $vuexts and create store
  // first assertion: ctr as Ctor<any>
  const sub = class VuexTS_Store extends (ctr as Ctor<any>)
   {
    [$vuexts]: VuextsInfo<T>;//<XT>
    constructor (...args:any[])
     {
      super(...args);
      //disable enumerable to allow deep copy of this (contains cycle)   this.$vuexts=new VuextsInfo<XT>();
      //replaced with Symbol Object.defineProperty(this, "$vuexts", {enumerable: false, value: new VuextsInfo<XT>()});
      this[$vuexts]=new VuextsInfo<T>();
      // second assertion: this as XT
      let that=this as any as XT;
      //let adjustedOptions: Vuex.StoreOptions<T>;//<XT>;
      //adjustedOptions=orioptions as Vuex.StoreOptions<T>;//<XT>;
      if (smi)
       {
        //adjustedOptions=adjustOptionsStore<T>(that, {...adjustedOptions}, smi);
        for (let hid of smi.hiddens)
         {
          //already initialized
          if (hid.descriptor===undefined)
           {
            //console.log("Vuexts store: defining property", hid, "value=", this[hid.propertyKey]);
            Object.defineProperty(this, hid.propertyKey, {enumerable: false, value: this[hid.propertyKey]});
           }
          else
           {
            //it is, by doing nothing   console.warn("Vuexts: @hidden get/set not implemented");
           }
         }
       };
      //console.log('ctr store: what\'s diff between ', that, ' and ', T.toString());
      this[$vuexts].store=new Vuex.Store<XT>({...orioptions,
        ...adjustOptionsStoMod<T>(that, smi),
        state: function() { return (that); }
       });
     }
   // final assertion: sub as Ctor<XT>
   } as Ctor<XT>;
  return sub;
}

/** Only accepts @store or @store(options). Does not accept @store().
 * 
 * @param options additional store options e.g. {plugins: ..., modules: ...}
 */
function store<T>(options?: Vuex.StoreOptions<T>): <CtorOfXT extends Ctor<T>>(ctr: CtorOfXT) => CtorOfXT;
function store<T>(ctr: Ctor<T>): Ctor<T>;
function store<T>(options?: Vuex.StoreOptions<T>|Ctor<T>)
 {
  //for @store(...), this==undefined

  if (typeof options=="function")
   {
    let ctr: (new(...args: any[])=>T)=options;
    return store_inner<T>(ctr, {});
   };
//  throw new Error("failure");

  return function <CtorOfT extends Ctor<T>>(ctr: CtorOfT)//new(...args:any[])=>{})
   {
    return store_inner<T>(ctr, options as Vuex.StoreOptions<T>|undefined);
   };
 }

export {store};

//see https://stackoverflow.com/questions/49868048/class-decorator-with-generic-parameter
function module_inner<T>(ctr: new(...args: any[])=>T, options?: Vuex.Module<T, any>)
 {
  // give a name to the extended T we will return
  /**/
  type XT = T & VuextsMixin<T>;
   /*{
    $vuexts: VuextsInfo<XT>;
   };*/
  /*/
  class XT extends (T as Ctor<any>)
   {
    $vuexts: VuextsInfo<XT>;
   };
  /**/

  
  let orioptions: Vuex.Module<T, any>=options || {};
  let smi=findStoModC(ctr);
  //console.log('got @module, ctr=', ctr, 'smi=', smi);
  if (!smi)
   {
    console.error("Vuexts: @module should have at least one @action or @mutation or @getter");
    //return ctr; //should not happen
   };

  //find getters and add them to smi.getters
  //inspired by vue-class-component/lib/component.js#componentFactory
  var proto = ctr.prototype;
  Object.getOwnPropertyNames(proto).forEach(function (key)
   {
    if (key === 'constructor') {
      return;
     }
    // known properties
    if ([""].indexOf(key) > -1) {
      //smi.something = proto[key];
      return;
    }
    var descriptor = Object.getOwnPropertyDescriptor(proto, key);
    //    if (typeof descriptor.value === 'function') {
    //        // methods
    //        (options.methods || (options.methods = {}))[key] = descriptor.value;
    //    }
    //else
    if (smi && descriptor && (descriptor.get || descriptor.set))
     {
      let ishidden=smi.hiddens.find(function(hi: HiddenInfo) {return hi.propertyKey==key;});
      if (!ishidden) //do not convert @hidden getter into Vuex getter
       {
        // computed properties
        let descriptor2=getter_inner(smi.target, key, descriptor);
        Object.defineProperty(proto, key, descriptor2);
       };
     };
   }); 


  //replace constructor to add $vuexts and create module
  const sub = class VuexTS_Module extends (ctr as Ctor<any>)
   {
    [$vuexts]: VuextsInfo<T>;//<XT>
    constructor (...args:any[])
     {
      super(...args);
      //disable enumerable to allow deep copy of this (contains cycle)   this.$vuexts=new VuextsInfo<XT>();
      //replaced with Symbol   Object.defineProperty(this, "$vuexts", {enumerable: false, value: new VuextsInfo<XT>()});
      this[$vuexts]=new VuextsInfo<T>();
      // second assertion: this as XT
      let that=this as any as XT;
      //let adjustedOptions: Vuex.Module<T, any>;//<XT, any>;
      //adjustedOptions=orioptions as Vuex.Module<T, any>;//<XT, any>;
      //let adjustedOptions: {getters: any, actions: any, mutations: any}|undefined=undefined;
      if (smi)
       {
        //adjustedOptions=adjustOptionsStoMod<T>(that, smi);
        for (let hid of smi.hiddens)
         {
          //already initialized
          if (hid.descriptor===undefined)
           {
            //console.log("Vuexts store: defining property", hid, "value=", this[hid.propertyKey]);
            Object.defineProperty(this, hid.propertyKey, {enumerable: false, value: this[hid.propertyKey]});
           }
          else
           {
            //it is, by doing nothing   console.warn("Vuexts: @hidden get/set not implemented");
           }
         }
       };
      //console.log('ctr store: what\'s diff between ', that, ' and ', T.toString());
      this[$vuexts].module_=that;
      this[$vuexts].rawmodule={...orioptions,
        ...adjustOptionsStoMod<T>(that, smi),
        state: function() {return (that);}
       };
     }
   // final assertion: sub as Ctor<XT>
   } as Ctor<XT>;
  return sub;
 }

/** Only accepts @module or @module(options). Does not accept @module().
 * 
 * @param options additional module options e.g. {namespaced?: boolean}
 */
function module<T>(options?: Vuex.Module<T, any>): <CtorOfXT extends Ctor<T>>(ctr: CtorOfXT) => CtorOfXT; 
function module<T>(ctr: Ctor<T>): Ctor<T>;
function module<T>(options?: Vuex.Module<T, any>|Ctor<T>)
 {
  //for @module(), this==undefined

  if (typeof options=="function")
   {
    let ctr: (new(...args: any[])=>T)=options;
    return module_inner<T>(ctr, {});
   };
//  throw new Error("failure");

  return function <CtorOfT extends Ctor<T>>(ctr: CtorOfT)//new(...args:any[])=>{})
   {
    return module_inner<T>(ctr, options as Vuex.Module<T, any>|undefined);
   };
 }

export {module};

function adjustOptionsStoMod<S>(that: S, smi: StoModInfo|undefined): {getters: any, actions: any, mutations: any}
 {
  let getters: any={};
  let actions: any={};
  let mutations: any={};
  if (smi)
   {
    smi.getters.forEach(function (g: GetterInfo)
     {
      getters[g.propertyKey]=function(state: Vuex.Store<S>, getters: any, rootState: Vuex.Store<any>, rootGetters: any)
         {
          //console.log('getter '+g.propertyKey+': that=', that);
          if (g.descriptor.get)
            return g.descriptor.get.call(that);
          else
            return g.descriptor.value.call(that); //perhaps just g.descriptor.value or test typeof .value==="function"
         };
     });

    smi.actions.forEach(function (a: ActionInfo)
     {
      actions[a.propertyKey]=function(context: any, payload: any)
         {
          //we could bind to 'context' but it has pretty much the same content as 'that'
          //and 'that' makes way more sense
          let res=a.descriptor.value.call(that, /*context, */payload);
          let asPromise=Promise.resolve(res);
          if (asPromise==res) //was a promise
            asPromise.catch(function(err)
             {
              console.error('Vuexts.action '+a.propertyKey+': exception', err);
             });
         };
     });

    smi.mutations.forEach(function (m: MutationInfo)
     {
      mutations[m.propertyKey]=function(state: S, payload: any)
         {
          //yep, state==that   console.log('mutation '+m.propertyKey+": that=",that,"state=",state);
          let result: any=m.descriptor.value.call(that, payload);
          //console.log("Vuexts: mutation "+m.propertyKey+" returns ", result);
          return result; //discarded by Vuex :-(
         };
     });
   };
  
  return {getters: getters, actions: actions, mutations: mutations};
 }

/**
 * Converts Vuex $store to decorated store
 * @param t E.g. this.$store
 */
export function getStore<T>(t: any): T
 {
  if (!t.state)
    throw Error("Vuexts.getStore called with not a store");
  let res=t.state as T&VuextsMixin<T>;
  if (!res || !res[$vuexts] || (res[$vuexts].store!=t))
   {
    console.error("Vuexts.getStore called with a non-decorated store");
    //cannot return undefined from getStore()   return;
   };
  return res;
 }

/**
 * Convert decorated store S to Vuex.Store<S> for Vue constructor
 * @param store Decorated store instance
 */
export function asVuex<S>(store: S): Vuex.Store<S>|undefined
 {
  //console.log('asVuex: store=', store);//, 'centralStore=', centralStore);
  if ((store as any as VuextsMixin<S>)[$vuexts])
    return (store as any as VuextsMixin<S>)[$vuexts].store;
  //if they didn't decorate
  console.error('Cannot convert non-decorated store to Vuex store', store);
  return undefined;
 }
 
/**
 * Converts Vuex module to decorated module
 * @param m e.g. this.$store.state.mymodule
 */
export function getModule<T>(m: any): T|undefined
 {
  //if (!m.state)
    //throw Error("Vuexts.getModule called with not a module");
  let res=m as T&VuextsMixin<T>;
  if (!res || !res[$vuexts] || (res[$vuexts].module_!=m))
   {
    console.error("Vuexts.getModule called with a non-decorated module", m);
    return;
   };
  return res[$vuexts].module_;
 }

/* * shouldn't be necessary
 * Convert decorated module S to Vuex.Module<S>
 * @param module Decorated module instance
 * /
export function asVuex<S>(module: S)
 {
  console.log('asVuex: AppStore=', AppStore);//, 'centralStore=', centralStore);
  let vi: VuextsInfo<T>|undefined=(module as any as VuextsMixin<T>)[$vuexts];
  if (vi.rawModule)
    return vi.rawModule;
  console.error('Cannot convert non-decorated module to Vuex module', module);
  return undefined;
 } */

export function registerModule<T>(decoratedStore: any, namespace: string[], module: T)
 {
  let vuexStore: Vuex.Store<any>;
  if ((decoratedStore as any)[$vuexts])
    vuexStore=((decoratedStore as any)[$vuexts]).store; //well it's VuextsSTOREinfo not MODULEInfo
  else
    vuexStore=decoratedStore as Vuex.Store<any>; //assume they already did
  let vi: VuextsInfo<T>|undefined=(module as any as VuextsMixin<T>)[$vuexts];
  //console.log("Vuexts registerModule: deco=", decoratedStore, "vuex=", vuexStore, "module=", module, "vi=", vi, "ns", namespace);
  if (!vi)
    console.error("Vuexts: cannot register non-decorated module");
  else
   {
    vi.store=vuexStore;
    vi.namespace=namespace;
   }
  vuexStore.registerModule(namespace, vi.rawmodule);
 }

export function unregisterModule<T>(decoratedStore: any, namespace: string[])
 {
  //TODO: *somebody* should clear the module's reference to the store
  let vuexStore: Vuex.Store<any>;
  if ((decoratedStore as any)[$vuexts])
    vuexStore=((decoratedStore as any)[$vuexts]).store; //well it's VuextsSTOREinfo not MODULEInfo
  else
    vuexStore=decoratedStore as Vuex.Store<any>; //assume they already did
  /*let vi: null|VuextsInfo<T> =(module as any as VuextsMixin<T>).$vuexts;
  if (!vi)
    console.error("Vuexts: cannot register non-decorated module");
  else
   {
    vi.store_=vuexStore;
    vi.namespace=namespace;
   }*/
  vuexStore.unregisterModule(namespace);
 }

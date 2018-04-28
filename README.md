# vuex-typescript-decorator
Vuex store as a decorated typescript class

## Quick start
1. Download **"vuex-typescript-decorator.ts"** and place it in your project's **/vuexts** folder.
I might turn it into an NPM package, when I learn how to do it...
1. Create the store in **/models/root.ts**
```typescript
import Vue from "vue";
import * as Vuex from "vuex";
import {store, action, mutation, asVuex} from '/vuexts/vuex-typescript-decorator';

@store
class TAppStore {
  protected _counter: number=0; //converted to state

  get counter() { //converted to getter
    return this._counter;
  }
  
  @mutation protected SET_COUNTER(payload: {value?: number}) { //converted to mutation
    if (payload.value===undefined)
      this._counter++;
    else
      this._counter=payload.value;
  }
  
  @action async setCounter(payload: {value?: number}): Promise<void> //converted to action
   {
    this.SET_COUNTER(payload);
   }
}

Vue.use(Vuex);
export { TAppStore };
export var AppStore=new TAppStore();
export var AppStoreVuexTS=asVuex(AppStore);
```

3. Initialize Vue in **/index.ts**
```typescript
import Vue from 'vue';
import App from '/App.vue';
import { AppStoreVuexTS } from "/models/root";

new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>',
  store: AppStoreVuexTS
})
```

4. In your component, define a helper function to convert this.$store into the typed store.
Or, you can access AppStore directly if you only have 1 instance.
```typescript
// SomePage.vue
...
<script lang="ts">
...
import { TAppStore } from "/models/root";
import { getStore } from "/vuexts/vuex-typescript-decorator";
@Component()
export default SomePage extends Vue {
  protected get store(): TAppStore
   {
    let res=getStore<TAppStore>(this.$store);
    return res;
   }
```

5. And finally, use it:
```typescript
// SomePage.vue
<template>
...
    {{counter}}
    <button @click="setCounter()">Increment</button>
    <button @click="setCounter(0)">Zero</button>
...
</template>
<script lang="ts">
  get counter() {
    return this.store.counter;
  }
  
  setCounter(value?: number) {
    this.store.setCounter({value: value});
  }
</script>
```

## All features
(to be improved)
### Store options, typed
```typescript
var AppStoreOptions: Vuex.StoreOptions<TAppStore>={
    modules: {
      stations: {
        namespaced: true
      }
    },
    plugins: [function (x: Vuex.Store<TAppStore>): string {
      return "Hello";
     }],
    strict: true
  };

@store(AppStoreOptions)
class TAppStore {
  ...
```
### Store options, direct
```typescript
@store({strict: true})
class TAppStore {
  ...
```
### Exclude some members from Vuex
```typescript
import { store, hidden } from "/vuexts/vuex-typescript-decorator";
@store TAppStore {
  @hidden protected _localStorageDirty: boolean=true; //can be assigned outside mutations
  @hidden get localStorageDirty() {return this._localStorageDirty;} //not converted to Vuex getter
  set localStorageDirty(lsd: boolean) {this._localStorageDirty=lsd;}
```
All variants are supported on @hidden: (variable, getter+setter) x (@hidden, @hidden())
```typescript
  @hidden protected _localStorageDirty: boolean=true;
  @hidden() protected _localStorageDirty: boolean=true;
  @hidden get localStorageDirty() {return this._localStorageDirty;}
  @hidden() get localStorageDirty() {return this._localStorageDirty;}
```
### Modules
Modules need to be decorated with **@module** instead of **@store**.
*Modules should always be namespaced, the code is not tested or developed for namespaced: false*.
#### Basic use
```typescript
@module({namespaced: true})
export class StationData
 {
  protected _identifier: string;
  get identifier() {return _identifier;}
```
#### Adding modules to store
You have to register modules in runtime, using functions registerModule and unregisterModule.
```typescript
import {registerModule as registerVuexModule,
        unregisterModule as unregisterVuexModule} from "/vuexts/vuex-typescript-decorator";
//add a new module to @store.stations.[identifier]
let that: TAppStore;
let module: StationData;
registerVuexModule<StationData>(that, ['stations', module.identifier], module);
//unregister
unregisterVuexModule<StationData>(that, ['stations', module.identifier]);
```
#### Get reference to a module inside Vue component
```typescript
// SomeStationPage.vue
import { getModule } from "/vuexts/vuex-typescript-decorator";
@Component() SomeStationPage extends Vue {
  protected get store(): StationData|undefined
   {
    let module=this.$store.state.stations[this.$route.params.identifier];
    let res: StationData|undefined=undefined;
    if (module)
      res=getModule<StationData>(module);
    return res;
   }
```

class FakeVirtualDOM {
    static #renderBuffer = 0;
    static #root = null;
    static createRoot(root) {
        const rootClass = new FakeVirtualDOM.#Root(root);
        FakeVirtualDOM.#root = rootClass;
        return FakeVirtualDOM.#root;
    }
    static #invokeRender() {
        FakeVirtualDOM.#renderBuffer++;
    }
    static #Root = class {
        #rootElement = null;
        constructor(rootElement) {
            this.#rootElement = rootElement;
        }
        render(renderElement) {
            let isFunction = false;
            if (typeof renderElement === "function") {
                isFunction = true;
            } else {
                isFunction = false;
            }
            const refresh = (bool) => {
                this.#rootElement.innerHTML = "";
                if (bool) {
                    this.#rootElement.appendChild(renderElement());
                } else {
                    this.#rootElement.appendChild(renderElement.render());
                }
                FakeVirtualDOM.FunctionComponent.invokeHooks();
            }
            refresh(isFunction);
            setInterval(() => {
                if (FakeVirtualDOM.#renderBuffer > 0) {
                    refresh(isFunction);
                    FakeVirtualDOM.#renderBuffer--;
                }
            }, 1);
        }
    }
    static ClassComponent = class {
        #props = {};
        constructor(props) {
            this.#props = props;
        }
        setState(updatedState) {
            Object.assign(this.state, updatedState);
            FakeVirtualDOM.#invokeRender();
        }
    }
    static FunctionComponent = class {
        static #states = [];
        static #effects = [];
        static #pendingEffects = [];
        static #effectsIndex = 0;
        static #statesIndex = -1;
        static #isMounted = false;
        static useState(value) {
            FakeVirtualDOM.FunctionComponent.#statesIndex++;
            const states = FakeVirtualDOM.FunctionComponent.#states;
            const statesIndex = FakeVirtualDOM.FunctionComponent.#statesIndex;
            const isMounted = FakeVirtualDOM.FunctionComponent.#isMounted;

            const setState = (v) => {
                states[statesIndex] = v;
                FakeVirtualDOM.#invokeRender();
            }

            if (!isMounted) {
                states.push(value);
                return [value, setState];
            }
            return [states[statesIndex], setState];
        }
        static useEffect(callback, targetStates) {
            const effects = FakeVirtualDOM.FunctionComponent.#effects;
            const pendingEffects = FakeVirtualDOM.FunctionComponent.#pendingEffects;
            const effectsIndex = FakeVirtualDOM.FunctionComponent.#effectsIndex;
            const isMounted = FakeVirtualDOM.FunctionComponent.#isMounted;
            if (arguments.length < 2) {
                pendingEffects.push(callback);
                return;
            }
            if (targetStates.length === 0 && !isMounted) {
                pendingEffects.push(callback);
                return;
            }
            if (effectsIndex >= effects.length) {
                effects.push(targetStates);
                FakeVirtualDOM.FunctionComponent.#effectsIndex++;
                return;
            }
            const originalValue = JSON.stringify(effects[effectsIndex]);
            const latestValue = JSON.stringify(targetStates);
            if (originalValue === latestValue) {
                FakeVirtualDOM.FunctionComponent.#effectsIndex++;
                return;
            }
            effects[effectsIndex] = targetStates
            pendingEffects.push(callback);
            FakeVirtualDOM.FunctionComponent.#effectsIndex++;
        }
        static invokeHooks() {
            FakeVirtualDOM.FunctionComponent.#isMounted = true;
            for (let i of FakeVirtualDOM.FunctionComponent.#pendingEffects) {
                i();
            }
            FakeVirtualDOM.FunctionComponent.#statesIndex = -1;
            FakeVirtualDOM.FunctionComponent.#effectsIndex = 0;
            FakeVirtualDOM.FunctionComponent.#pendingEffects = [];

        }
    }
}

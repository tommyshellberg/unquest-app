import { NativeModule, registerWebModule } from 'expo-modules-core';

import { type ChangeEventPayload } from './LockState.types';

type LockStateModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

class LockStateModule extends NativeModule<LockStateModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(LockStateModule);

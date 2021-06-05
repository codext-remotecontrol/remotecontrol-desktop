import { Storage } from '@capacitor/storage';
import { AppConfig } from '../../../environments/environment';

export async function set(key: string, value: any): Promise<void> {
  await Storage.set({
    key: `${AppConfig.appName}-${key}`,
    value: JSON.stringify(value),
  });
}

export async function get(key: string): Promise<any> {
  let item = await Storage.get({ key: `${AppConfig.appName}-${key}` });
  try {
    item = JSON.parse(item.value);
    return item;
  } catch (error) {
    return item;
  }
}

export async function remove(key: string): Promise<void> {
  await Storage.remove({
    key: `${AppConfig.appName}-${key}`,
  });
}

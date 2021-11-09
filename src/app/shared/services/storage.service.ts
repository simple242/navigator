import {Injectable} from '@angular/core'

@Injectable()
export class StorageService {

  private storage: Storage = window.localStorage

  public get length(): number {
    return this.storage.length
  }

  public get(item: string): any {
    if (!item) return ''
    const lsData = this.storage.getItem(item)

    if (!lsData) return ''

    try {
      return JSON.parse(lsData)
    } catch (e) {
      return lsData
    }
  }

  public set(item: string, value: any): void {
    if (!item || !value) return

    if (typeof value === 'string') {
      this.storage.setItem(item, value)
      return
    }

    try {
      this.storage.setItem(item, JSON.stringify(value))
    } catch (e) {
      console.error(e)
    }
  }

  public clear(): void {
    this.storage.clear()
  }

  public remove(item: string): void {
    if (!item) return

    this.storage.removeItem(item)
  }

  public key(idx: number): any {
    const lsData = this.storage.key(idx)

    if (!lsData) return ''

    try {
      return JSON.parse(lsData)
    } catch (e) {
      return lsData
    }
  }

}

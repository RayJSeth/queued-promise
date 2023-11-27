type PromiseFunction<T, A extends unknown[]> = (...args: A) => Promise<T>

class QueuedPromise<T, A extends unknown[]> implements Promise<T> {
  private readonly args: A
  private readonly stringTag = 'QueuedPromise'
  private promiseFunction: PromiseFunction<T, A>
  private chainedPromise: Promise<T> | null = null
  private callbacks: (() => void)[] = []

  constructor(promiseFunction: PromiseFunction<T, A>, ...args: A) {
    this.promiseFunction = promiseFunction
    this.args = args
  }

  private createChainedPromise(): Promise<T> {
    const executePromiseFunction = () => {
      return this.promiseFunction.apply(null, this.args)
    }

    return new Promise<T>((resolve, reject) => {
      const result = executePromiseFunction()
      result.then(resolve).catch(reject)
    })
  }

  public enqueue(): Promise<T> {
    this.chainedPromise = this.createChainedPromise()

    this.callbacks.forEach((callback) => {
      callback()
    })

    this.callbacks = []

    return this.chainedPromise
  }

  private addCallback(callback: () => void): void {
    this.callbacks.push(callback)
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined
  ): QueuedPromise<TResult1 | TResult2, A> {
    const callback = () => {
      if (this.chainedPromise) {
        this.chainedPromise = this.chainedPromise.then(
          onfulfilled,
          onrejected
        ) as unknown as Promise<T>
      }
    }
    this.addCallback(callback)
    return this as unknown as QueuedPromise<TResult1 | TResult2, A>
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: unknown) => TResult | PromiseLike<TResult>)
      | null
      | undefined
  ): QueuedPromise<T | TResult, A> {
    const callback = () => {
      if (this.chainedPromise) {
        this.chainedPromise = this.chainedPromise.catch((reason) => {
          if (onrejected) {
            return Promise.resolve(onrejected(reason))
          }
          return Promise.reject(reason)
        }) as unknown as Promise<T>
      }
    }
    this.addCallback(callback)
    return this as unknown as QueuedPromise<T | TResult, A>
  }

  finally(onfinally?: (() => void) | null | undefined): QueuedPromise<T, A> {
    const callback = () => {
      if (this.chainedPromise) {
        this.chainedPromise = this.chainedPromise.finally(onfinally)
      }
    }
    this.addCallback(callback)
    return this as unknown as QueuedPromise<T, A>
  }

  get [Symbol.toStringTag](): string {
    return this.stringTag
  }
}

export default QueuedPromise

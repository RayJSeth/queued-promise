import QueuedPromise from '../src/index'

const mockPromiseFunction = jest.fn()
const mockErr = new Error('error')

afterEach(() => jest.resetAllMocks())

describe('QueuedPromise', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create an instance of QueuedPromise but not execute underlying promise', () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)

    expect(queuedPromise).toBeInstanceOf(QueuedPromise)
    expect(mockPromiseFunction).not.toHaveBeenCalled()
  })

  it('enqueue should initiate a promise', async () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    mockPromiseFunction.mockResolvedValue('result')

    const result = await queuedPromise.enqueue()

    expect(result).toBe('result')
    expect(mockPromiseFunction).toHaveBeenCalled()
  })

  it('should handle then method and enqueue chained promises', async () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    mockPromiseFunction.mockResolvedValue('result')
    const onFulfilled = jest.fn().mockResolvedValue('thenResult')

    const result = await queuedPromise.then(onFulfilled).enqueue()

    expect(result).toBe('thenResult')
    expect(onFulfilled).toHaveBeenCalledWith('result')
  })

  it('should handle catch method and enqueue chained promises', async () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    mockPromiseFunction.mockRejectedValue(mockErr)
    const onRejected = (err: unknown) => {
      expect(err).toBe(mockErr)
      return 'caught mockErr'
    }

    await expect(queuedPromise.catch(onRejected).enqueue()).resolves.toBe(
      'caught mockErr'
    )
  })

  it('should handle finally method and enqueue chained promises when resolved', async () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    mockPromiseFunction.mockResolvedValue('result')
    const onFinally = jest.fn()

    const result = await queuedPromise.finally(onFinally).enqueue()

    expect(result).toBe('result')
    expect(onFinally).toHaveBeenCalled()
  })

  it('should handle finally method and enqueue chained promises when rejected', async () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    mockPromiseFunction.mockRejectedValue(mockErr)
    const onFinally = jest.fn()

    await expect(queuedPromise.finally(onFinally).enqueue()).rejects.toBe(
      mockErr
    )

    expect(onFinally).toHaveBeenCalled()
  })

  it('should handle callbacks when using then/catch/finally methods', async () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    const callback = jest.fn()

    queuedPromise
      .then(() => {})
      .catch(() => {})
      .finally(callback)
    await queuedPromise.enqueue()

    expect(callback).toHaveBeenCalled()
  })

  // it('should handle empty catches', async () => {
  //   const queuedPromise = new QueuedPromise(mockPromiseFunction)
  //   const callback = jest.fn()

  //   queuedPromise.catch()

  //   await queuedPromise.enqueue()

  //   expect(callback).toHaveBeenCalled()
  // })

  it('should have a custom toStringTag', () => {
    const queuedPromise = new QueuedPromise(mockPromiseFunction)
    expect(Object.prototype.toString.call(queuedPromise)).toBe(
      '[object QueuedPromise]'
    )
    expect(queuedPromise[Symbol.toStringTag]).toBe('QueuedPromise')
  })
})

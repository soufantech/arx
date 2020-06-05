export class Collection<T> {
  private collection: T[] = [];

  insert(document: T): this {
    this.collection.push(document);

    return this;
  }

  find(query: Partial<T>): T[] | null {
    const criteria = Object.entries(query);

    const results = this.collection.reduce((acc, doc) => {
      const match = criteria.every(([field, value]) => doc[field] === value);

      if (match) {
        acc.push(doc);
      }

      return acc;
    }, [] as T[]);

    return results.length ? results : null;
  }

  findOne(query: Partial<T>): T | null {
    const result = this.find(query);

    if (result === null) {
      return null;
    }

    return result[0];
  }
}

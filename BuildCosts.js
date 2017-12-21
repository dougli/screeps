class BuildCosts {
  /**
   * Given an ideal build in parts and max capacity, returns a config that fits
   * as many of the given parts into the creep as possible
   */
  static getBestBuild(parts, capacity) {
    let remainingCapacity = capacity;
    for (let ii = 0; ii < parts.length; ii++) {
      const partCost = BODYPART_COST[parts[ii]];
      if (remainingCapacity < partCost) {
        return parts.slice(0, ii);
      }
      remainingCapacity -= partCost;
    }

    return parts;
  }

  /**
   * Given a segment (multiple parts), returns a creep that the given capacity
   * allows, up to maxRepeats segments.
   */
  static getBestRepeatingBuild(segment, maxSegments, capacity) {
    const segmentCost = segment.reduce((sum, part) => {
      return sum + BODYPART_COST[part];
    }, 0);

    const result = [];
    const segments = Math.min(Math.floor(capacity / segmentCost), maxSegments);
    for (let ii = 0; ii < segments; ii++) {
      Array.prototype.push.apply(result, segment);
    }
    return result;
  }
}

module.exports = BuildCosts;

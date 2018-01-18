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

    const nonToughSegments = segment.filter((part) => {
      return part !== TOUGH;
    });
    const numToughSegments = segment.length - nonToughSegments.length;

    const result = [];
    const repeats = Math.min(Math.floor(capacity / segmentCost), maxSegments);
    for (let ii = 0; ii < repeats * numToughSegments; ii++) {
      result.push(TOUGH);
    }
    for (let ii = 0; ii < repeats; ii++) {
      Array.prototype.push.apply(result, nonToughSegments);
    }
    return result;
  }
}

module.exports = BuildCosts;

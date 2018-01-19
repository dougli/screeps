const Profiler = require('Profiler');

const MIN_PROFIT_PER_ENERGY = 0.2;

const ARBITRAGE_RESOURCES = [
  RESOURCE_HYDROGEN,
  RESOURCE_OXYGEN,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_ZYNTHIUM,
  RESOURCE_CATALYST,
];

const Arbitrage = {
  run: function(room) {
    if (!room.terminal || !room.terminal.my) {
      return;
    }

    const resourceType = ARBITRAGE_RESOURCES[
      Math.floor(Math.random() * ARBITRAGE_RESOURCES.length)
    ];
  },

  getBestSpread: function(resourceType, room) {
    const orders = Game.market.getAllOrders({resourceType});
    const buys = orders.filter(order => order.type === ORDER_BUY);
    const sells = orders.filter(order => order.type === ORDER_SELL);

    let bestTrade = null;
    let bestValue = MIN_PROFIT_PER_ENERGY;
    for (const sell of sells) {
      for (const buy of buys) {
        let spread = buy.price - sell.price;
        if (spread <= 0) {
          continue;
        }

        let energyCost = (
            Game.market.calcTransactionCost(1000, room, sell.roomName) +
            Game.market.calcTransactionCost(1000, room, buy.roomName)
        ) / 1000;

        let profitPerEnergy = spread / energyCost;
        if (profitPerEnergy > bestValue) {
          let amount = Math.min(
            sell.amount,
            buy.amount,
            Game.market.credits / sell.price
          );

          bestTrade = {buy: sell, sell: buy, amount, profitPerEnergy};
          bestValue = profitPerEnergy;
        }
      }
    }

    return bestTrade;
  }
};

Profiler.registerObject(Arbitrage, 'Arbitrage');

module.exports = Arbitrage;

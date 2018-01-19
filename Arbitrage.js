const Profiler = require('Profiler');

const MIN_PROFIT_PER_ENERGY = 0.2;
const MAX_TRADE = 10000;
const MAX_ENERGY_PER_TICK = 10;
const TICKS_TO_CLOSE_TRADE = 20;

const ARBITRAGE_RESOURCES = [
  RESOURCE_HYDROGEN,
  RESOURCE_OXYGEN,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_ZYNTHIUM,
];

const Arbitrage = {
  run: function(room) {
    if (!room.terminal || !room.terminal.my || room.terminal.cooldown > 0) {
      return;
    }

    // We're in the middle of a deal here!
    let trade = room.memory.arbitrage;
    if (trade) {
      // There's a small risk the order has already been closed
      Game.market.deal(trade.sell.id, trade.amount, room.name);
      delete room.memory.arbitrage;
      return;
    }

    const resourceType = ARBITRAGE_RESOURCES[
      Math.floor(Math.random() * ARBITRAGE_RESOURCES.length)
    ];

    trade = Arbitrage.getBestTrade(resourceType, room);
    if (trade) {
      Game.market.deal(trade.buy.id, trade.amount, room.name);
      room.memory.arbitrage = trade;
    }
  },

  getBestTrade: function(resourceType, room) {
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
            Game.market.calcTransactionCost(1000, room.name, sell.roomName) +
            Game.market.calcTransactionCost(1000, room.name, buy.roomName)
        ) / 1000;

        let profitPerEnergy = spread / energyCost;
        if (profitPerEnergy > bestValue) {
          let amount = Math.min(
            MAX_TRADE,
            sell.amount,
            buy.amount,
            Math.floor(Game.market.credits / sell.price),
            Math.floor(MAX_ENERGY_PER_TICK * TICKS_TO_CLOSE_TRADE / energyCost)
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

import * as Profiler from 'Profiler';

interface ArbitrageDeal {
  buy: Order;
  sell: Order;
  amount: number;
  profitPerEnergy: number;
  profit: number;
}

const MIN_PROFIT_PER_ENERGY = 0.15;
const MAX_TRADE = 10000;
const MAX_ENERGY_PER_TICK = 10;
const TICKS_TO_CLOSE_TRADE = 20;
const WAIT_TIME = 19;

const ARBITRAGE_RESOURCES = [
  RESOURCE_HYDROGEN,
  RESOURCE_OXYGEN,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_ZYNTHIUM,
];

class Arbitrage {
  public static run(room: Room): void {
    if (!room.terminal || !room.terminal.my || room.terminal.cooldown > 0) {
      return;
    }

    // We're in the middle of a deal here!
    let trade = room.memory.arbitrage;
    if (trade && trade.waitTill > Game.time) {
      return;
    }
    if (trade && trade.sell) {
      delete room.memory.arbitrage;

      // Make sure the sell pair has not changed underneath our feet
      const sell = Game.market.getOrderById(trade.sell.id);
      if (sell && sell.price >= trade.sell.price) {
        Game.market.deal(trade.sell.id, trade.amount, room.name);
      }

      return;
    }

    trade = Arbitrage.getBestTrade(room);
    if (trade) {
      Game.market.deal(trade.buy.id, trade.amount, room.name);
      room.memory.arbitrage = trade;
    } else {
      room.memory.arbitrage = {waitTill: Game.time + WAIT_TIME};
    }
  }

  private static getBestTrade(room: Room): ArbitrageDeal | null {
    const allOrders = Game.market.getAllOrders();

    let bestTrade: ArbitrageDeal | null = null;
    for (const resource of ARBITRAGE_RESOURCES) {
      const orders = allOrders.filter((order) => order.resourceType === resource);

      const buys = orders.filter((order) => order.type === ORDER_BUY);
      const sells = orders.filter((order) => order.type === ORDER_SELL);
      if (!buys.length || !sells.length) {
        continue;
      }

      let best = {
        amount: 0,
        buy: sells[0],
        profit: -Number.MAX_VALUE,
        profitPerEnergy: -Number.MAX_VALUE,
        sell: buys[0],
      };
      let updated = false;
      do {
        updated = false;
        for (const buy of buys) {
          const result = Arbitrage.evaluateDeal(best.buy, buy, room.name);
          if (result.profit > best.profit) {
            best = result;
            updated = true;
          }
        }

        for (const sell of sells) {
          const result = Arbitrage.evaluateDeal(sell, best.sell, room.name);
          if (result.profit > best.profit) {
            best = result;
            updated = true;
          }
        }
      } while (updated);
      if (best.profitPerEnergy > MIN_PROFIT_PER_ENERGY &&
          (!bestTrade || best.profit > bestTrade.profit)) {
        bestTrade = best;
      }
    }

    return bestTrade && bestTrade.profit > 0 ? bestTrade : null;
  }

  private static evaluateDeal(
    sell: Order,
    buy: Order,
    roomName: string,
  ): ArbitrageDeal {
    const spread = buy.price - sell.price;

    const energyCost = (
      Game.market.calcTransactionCost(1000, roomName, '' + sell.roomName) +
      Game.market.calcTransactionCost(1000, roomName, '' + buy.roomName)
    ) / 1000;

    const amount = Math.min(
      MAX_TRADE,
      sell.amount,
      buy.amount,
      Math.floor(Game.market.credits / sell.price),
      Math.floor(MAX_ENERGY_PER_TICK * TICKS_TO_CLOSE_TRADE / energyCost),
    );

    const profitPerEnergy = spread / energyCost;
    const profit = amount * spread;
    return {buy: sell, sell: buy, amount, profitPerEnergy, profit};
  }
}

Profiler.registerObject(Arbitrage, 'Arbitrage');

export { Arbitrage };

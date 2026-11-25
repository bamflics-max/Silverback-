/* ---------------- this page: the street, the main lobby. For now, its alley ---------------- */
var SCENE = {
  what: 'street', sub: 'Street, second version', first: 'street', sky: 0x0b0f19,
  spots: {
    street: { pos: V(-5.6, 1.6, 29.6), at: V(20, 2.6, 28.6) },                /* at the dead end, looking down the whole street */
    shop: { pos: V(0.6, 1.6, 29.6), at: V(0.2, 2.1, 35) },                    /* the cosmetics shop, across from the alley */
    booths: { pos: V(11.0, 1.6, 27.9), at: V(13.2, 1.5, 33) },                /* the vendors' booths */
    champs: { pos: V(8.2, 1.6, 29.2), at: V(8.0, 2.5, 24) },                  /* the wall of champions */
    yard: { pos: V(26.9, 1.6, 23.7), at: V(26.4, 1.6, 16.5) },                  /* at the gate of the practice yard */
    hoop: { pos: V(32.6, 1.6, 29.3), at: V(40, 2.7, 29) },                    /* the hoop at the end of the street */
    roof: { pos: V(33.3, 7.65, 22.7), at: V(38.2, 6.5, 15.4) },                    /* up on the roof, looking back over the street */
    alley: { pos: V(0.4, 1.5, 2.4), at: V(0.1, 2.7, 24) },                    /* stepping out of the elevator, looking up the alley */
    back: { pos: V(-0.5, 1.5, 12.8), at: V(0, 2.7, 0) },                      /* half way up, looking back at the elevator and its sign */
    dock: { pos: V(1.0, 1.5, 12.6), at: V(-4.7, 1.9, 10.3) },                 /* the loading dock in its nook */
    escape: { pos: V(-0.6, 1.5, 7.4), at: V(3.5, 4.8, 11.4) },                /* looking up at the fire escape and the strings of bulbs */
    barrel: { pos: V(-1.5, 1.5, 17.9), at: V(1.6, 0.95, 20.2) },               /* the fire barrel */
    mouth: { pos: V(-0.9, 1.6, 23.8), at: V(0.25, 2.9, 0) }                    /* at the mouth of the alley, looking back down all of it */
  },
  build: function (world, step) {
    step('alley textures', buildStreetTextures);
    var list = buildStreet(world, step);
    this.flicker = [FAR_LIGHTS.lamps[6], NEAR_LIGHTS.lamps[8]];              /* the fire barrel, and one tired wall lamp */
    return list;
  },
  frame: function () { renderWet(); }
};

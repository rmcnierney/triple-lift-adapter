/**
 * @author:    Index Exchange
 * @license:   UNLICENSED
 *
 * @copyright: Copyright (C) 2017 by Index Exchange. All rights reserved.
 *
 * The information contained within this document is confidential, copyrighted
 *  and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 */
// jshint ignore: start

'use strict';

/* =====================================
 * Utilities
 * ---------------------------------- */

/**
 * Returns an array of parcels based on all of the xSlot/htSlot combinations defined
 * in the partnerConfig (simulates a session in which all of them were requested).
 *
 * @param {object} profile
 * @param {object} partnerConfig
 * @returns []
 */
function generateReturnParcels(profile, partnerConfig) {
    var returnParcels = [];

    for (var htSlotName in partnerConfig.mapping) {
        if (partnerConfig.mapping.hasOwnProperty(htSlotName)) {
            var xSlotsArray = partnerConfig.mapping[htSlotName];
            for (var i = 0; i < xSlotsArray.length; i++) {
                var xSlotName = xSlotsArray[i];
                returnParcels.push({
                    partnerId: profile.partnerId,
                    htSlot: {
                        getId: function () {
                            return htSlotName
                        }
                    },
                    ref: "",
                    xSlotRef: partnerConfig.xSlots[xSlotName],
                    requestId: '_' + Date.now()
                });
            }
        }
    }

    return returnParcels;
}

/* =====================================
 * Testing
 * ---------------------------------- */

describe('__parseResponse', function () {

    /* Setup and Library Stub
     * ------------------------------------------------------------- */
    var inspector = require('schema-inspector');
    var proxyquire = require('proxyquire').noCallThru();
    var libraryStubData = require('./support/libraryStubData.js');
    var partnerModule = proxyquire('../triple-lift-htb.js', libraryStubData);
    var partnerConfig = require('./support/mockPartnerConfig.json');
    var responseData = require('./support/mockResponseData.json');
    /* -------------------------------------------------------------------- */

    /* Instatiate your partner module */
    var partnerModule = partnerModule(partnerConfig);
    var partnerProfile = partnerModule.__profile;
    var result, expectedValue, mockData, returnParcels, matchingResponse;

    describe('should correctly parse bids:', function () {

        /* Simple type checking on the returned objects */
        it('each parcel should have the required fields set', function () {
            returnParcels = generateReturnParcels(partnerModule.__profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.bid;

            for (var i = 0; i < returnParcels.length; i++) {

                partnerModule.__parseResponse(1, mockData[i], [returnParcels[i]]);

                matchingResponse = mockData[i];

                /* Validate the returnParcel objects after they've been parsed */
                result = inspector.validate({
                    type: 'object',
                    properties: {
                        targetingType: {
                            type: 'string',
                            eq: 'slot',
                            error: 'targetingType field must be set to "slot".'
                        },
                        targeting: {
                            type: 'object',
                            properties: {
                                [partnerModule.__profile.targetingKeys.id]: {
                                    type: 'array',
                                    exactLength: 1,
                                    items: {
                                        type: 'string',
                                        minLength: 1
                                    },
                                    error: 'id targetingKey field must be correctly set.'
                                },
                                [partnerModule.__profile.targetingKeys.om]: {
                                    type: 'array',
                                    exactLength: 1,
                                    exec: function (schema, post) {
                                        var expectedValue = matchingResponse.width + 'x' +
                                            matchingResponse.height + '_' +
                                            matchingResponse.cpm;

                                        if (post[0] !== expectedValue) {
                                            this.report('om targetingKey value: ' + post[0] + ' is incorrect!');
                                        }
                                    }
                                },
                                pubKitAdId: {
                                    type: 'string',
                                    minLength: 1,
                                    error: 'pubKitAdId targetingKey field must be correctly set.'
                                }
                            }
                        },
                        price: {
                            type: 'number',
                            eq: Number(matchingResponse.cpm),
                            error: 'price field must be correctly set.'
                        },
                        size: {
                            type: 'array',
                            exactLength: 2,
                            exec: function (schema, post) {
                                var expectedValue = [matchingResponse.width, matchingResponse.height];
                                if (post[0] !== expectedValue[0] || post[1] !== expectedValue[1]) {
                                    this.report('the size value: ' + post + ' is incorrect!');
                                }
                            }
                        },
                        adm: {
                            type: 'string',
                            minLength: 1,
                            eq: matchingResponse.ad,
                            error: 'adm field must be correctly set.'
                        }
                    }
                }, returnParcels[i]);

                expect(result.valid, result.format()).toEqual(true);
            }
        });
    });

    describe('should correctly parse passes: ', function () {

        it('each parcel should have the required fields set', function () {
            returnParcels = generateReturnParcels(partnerModule.__profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.pass;

            for (var i = 0; i < returnParcels.length; i++) {

                 partnerModule.__parseResponse(1, mockData[i], [returnParcels[i]]);

                /* Validate the returnParcel objects after they've been parsed */
                result = inspector.validate({
                    type: 'object',
                    properties: {
                        pass: {
                            type: 'boolean',
                            eq: true,
                            error: 'pass field must be correctly set.'
                        }
                    }
                }, returnParcels[i]);

                expect(result.valid, result.format()).toEqual(true);
            }
        });
    });

    describe('should correctly parse deals: ', function () {

        /* Simple type checking on the returned objects, should always pass */
        it('each parcel should have the required fields set', function () {
            returnParcels = generateReturnParcels(partnerModule.__profile, partnerConfig);

            /* Get mock response data from our responseData file */
            mockData = responseData.deals;

            for (var i = 0; i < returnParcels.length; i++) {

                partnerModule.__parseResponse(1, mockData[i], [returnParcels[i]]);

                matchingResponse = mockData[i];

                /* Validate the returnParcel objects after they've been parsed */
                result = inspector.validate({
                    type: 'object',
                    properties: {
                        targetingType: {
                            type: 'string',
                            eq: 'slot',
                            error: 'targetingType field must be set to "slot".'
                        },
                        targeting: {
                            type: 'object',
                            properties: {
                                [partnerModule.__profile.targetingKeys.id]: {
                                    type: 'array',
                                    exactLength: 1,
                                    items: {
                                        type: 'string',
                                        minLength: 1
                                    },
                                    error: 'id targetingKey field must be correctly set.'
                                },
                                [partnerModule.__profile.targetingKeys.pm]: {
                                    type: 'array',
                                    exactLength: 1,
                                    exec: function (schema, post) {
                                        var expectedValue = matchingResponse.width + 'x' +
                                            matchingResponse.height + '_' +
                                            matchingResponse.deal_id;

                                        if (post[0] !== expectedValue) {
                                            this.report('om targetingKey value: ' + post[0] + ' is incorrect! Expected: ' + expectedValue);
                                        }
                                    }
                                },
                                [partnerModule.__profile.targetingKeys.om]: {
                                    type: 'array',
                                    exactLength: 1,
                                    exec: function (schema, post) {
                                        var expectedValue = matchingResponse.width + 'x' +
                                            matchingResponse.height + '_' +
                                            matchingResponse.cpm;

                                        if (post[0] !== expectedValue) {
                                            this.report('om targetingKey value: ' + post[0] + ' is incorrect!');
                                        }
                                    }
                                },
                                pubKitAdId: {
                                    type: 'string',
                                    minLength: 1,
                                    error: 'pubKitAdId targetingKey field must be correctly set.'
                                }
                            }
                        },
                        price: {
                            type: 'number',
                            eq: Number(matchingResponse.cpm),
                            error: 'price field must be correctly set.'
                        },
                        size: {
                            type: 'array',
                            exactLength: 2,
                            exec: function (shema, post) {
                                var expectedValue = [matchingResponse.width, matchingResponse.height];
                                if (post[0] !== expectedValue[0] || post[1] !== expectedValue[1]) {
                                    this.report('the size value: ' + post + ' is incorrect!');
                                }
                            }
                        },
                        adm: {
                            type: 'string',
                            minLength: 1,
                            eq: matchingResponse.ad,
                            error: 'adm field must be correctly set.'
                        }
                    }
                }, returnParcels[i]);

                expect(result.valid, result.format()).toEqual(true);
            }
        });
    });
});
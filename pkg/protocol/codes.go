package protocol

// Notes:
//   2020-08-31 (@phendryx): OpAuctionGetItemsAverage removed from op codes
//			     based on public suggested changes and
//               @marleythemongolianmoose's findings:
//               "MarleyTheMongolianMoose: AuctionGetItemsAverage == 92 == kind
//               of looks like it disappears in the new one"

// OperationType used to identify operation types
//
//go:generate stringer -type=OperationType
type OperationType uint16

const (
	OpUnused                                                OperationType = 0
	OpPing                                                                = 1
	OpJoin                                                                = 2
	OpVersionedOperation                                                  = 3
	OpCreateAccount                                                       = 4
	OpLogin                                                               = 5
	OpCreateGuestAccount                                                  = 6
	OpCreatePlatformOnlyAccount                                           = 7
	OpSendCrashLog                                                        = 8
	OpSendTraceRoute                                                      = 9
	OpSendVfxStats                                                        = 10
	OpSendGamePingInfo                                                    = 11
	OpCreateCharacter                                                     = 12
	OpDeleteCharacter                                                     = 13
	OpSelectCharacter                                                     = 14
	OpAcceptPopups                                                        = 15
	OpRedeemKeycode                                                       = 16
	OpGetGameServerByCluster                                              = 17
	OpGetShopPurchaseUrl                                                  = 18
	OpGetReferralSeasonDetails                                            = 19
	OpGetReferralLink                                                     = 20
	OpGetShopTilesForCategory                                             = 21
	OpMove                                                                = 22
	OpAttackStart                                                         = 23
	OpCastStart                                                           = 24
	OpCastCancel                                                          = 25
	OpTerminateToggleSpell                                                = 26
	OpChannelingCancel                                                    = 27
	OpAttackBuildingStart                                                 = 28
	OpInventoryDestroyItem                                                = 29
	OpInventoryMoveItem                                                   = 30
	OpInventoryRecoverItem                                                = 31
	OpInventoryRecoverAllItems                                            = 32
	OpInventorySplitStack                                                 = 33
	OpInventorySplitStackInto                                             = 34
	OpInventoryStack                                                      = 35
	OpInventoryReorder                                                    = 36
	OpInventoryDropAll                                                    = 37
	OpInventoryAddToStacks                                                = 38
	OpInventoryMoveGivenItems                                             = 39
	OpGetClusterData                                                      = 40
	OpChangeCluster                                                       = 41
	OpConsoleCommand                                                      = 42
	OpChatMessage                                                         = 43
	OpReportClientError                                                   = 44
	OpRegisterToObject                                                    = 45
	OpUnRegisterFromObject                                                = 46
	OpCraftBuildingChangeSettings                                         = 47
	OpCraftBuildingTakeMoney                                              = 48
	OpRepairBuildingChangeSettings                                        = 49
	OpRepairBuildingTakeMoney                                             = 50
	OpActionBuildingChangeSettings                                        = 51
	OpHarvestStart                                                        = 52
	OpHarvestCancel                                                       = 53
	OpTakeSilver                                                          = 54
	OpActionOnBuildingStart                                               = 55
	OpActionOnBuildingCancel                                              = 56
	OpInstallResourceStart                                                = 57
	OpInstallResourceCancel                                               = 58
	OpInstallSilver                                                       = 59
	OpBuildingFillNutrition                                               = 60
	OpBuildingChangeRenovationState                                       = 61
	OpBuildingBuySkin                                                     = 62
	OpBuildingClaim                                                       = 63
	OpBuildingGiveup                                                      = 64
	OpBuildingNutritionSilverStorageDeposit                               = 65
	OpBuildingNutritionSilverStorageWithdraw                              = 66
	OpBuildingNutritionSilverRewardSet                                    = 67
	OpConstructionSiteCreate                                              = 68
	OpPlaceableObjectPlace                                                = 69
	OpPlaceableObjectPlaceCancel                                          = 70
	OpPlaceableObjectPickup                                               = 71
	OpFurnitureObjectUse                                                  = 72
	OpFarmableHarvest                                                     = 73
	OpFarmableFinishGrownItem                                             = 74
	OpFarmableDestroy                                                     = 75
	OpFarmableGetProduct                                                  = 76
	OpFarmableFill                                                        = 77
	OpTearDownConstructionSite                                            = 78
	OpAuctionCreateOffer                                                  = 79
	OpAuctionCreateRequest                                                = 80
	OpAuctionGetOffers                                                    = 81
	OpAuctionGetRequests                                                  = 82
	OpAuctionBuyOffer                                                     = 83
	OpAuctionAbortAuction                                                 = 84
	OpAuctionModifyAuction                                                = 85
	OpAuctionAbortOffer                                                   = 86
	OpAuctionAbortRequest                                                 = 87
	OpAuctionSellRequest                                                  = 88
	OpAuctionGetFinishedAuctions                                          = 89
	OpAuctionGetFinishedAuctionsCount                                     = 90
	OpAuctionFetchAuction                                                 = 91
	OpAuctionGetMyOpenOffers                                              = 92
	OpAuctionGetMyOpenRequests                                            = 93
	OpAuctionGetMyOpenAuctions                                            = 94
	OpAuctionGetItemAverageStats                                          = 95
	OpAuctionGetItemAverageValue                                          = 96
	OpAuctionGetLowestOfferPrices                                         = 97
	OpContainerOpen                                                       = 98
	OpContainerClose                                                      = 99
	OpContainerManageSubContainer                                         = 100
	OpRespawn                                                             = 101
	OpSuicide                                                             = 102
	OpJoinGuild                                                           = 103
	OpLeaveGuild                                                          = 104
	OpCreateGuild                                                         = 105
	OpInviteToGuild                                                       = 106
	OpDeclineGuildInvitation                                              = 107
	OpKickFromGuild                                                       = 108
	OpInstantJoinGuild                                                    = 109
	OpDuellingChallengePlayer                                             = 110
	OpDuellingAcceptChallenge                                             = 111
	OpDuellingDenyChallenge                                               = 112
	OpChangeClusterTax                                                    = 113
	OpClaimTerritory                                                      = 114
	OpGiveUpTerritory                                                     = 115
	OpChangeTerritoryAccessRights                                         = 116
	OpGetMonolithInfo                                                     = 117
	OpGetClaimInfo                                                        = 118
	OpGetAttackInfo                                                       = 119
	OpGetTerritorySeasonPoints                                            = 120
	OpGetAttackSchedule                                                   = 121
	OpGetMatches                                                          = 122
	OpGetMatchDetails                                                     = 123
	OpJoinMatch                                                           = 124
	OpLeaveMatch                                                          = 125
	OpGetClusterInstanceInfoForStaticCluster                              = 126
	OpChangeChatSettings                                                  = 127
	OpLogoutStart                                                         = 128
	OpLogoutCancel                                                        = 129
	OpClaimOrbStart                                                       = 130
	OpClaimOrbCancel                                                      = 131
	OpMatchLootChestOpeningStart                                          = 132
	OpMatchLootChestOpeningCancel                                         = 133
	OpDepositToGuildAccount                                               = 134
	OpWithdrawalFromAccount                                               = 135
	OpChangeGuildPayUpkeepFlag                                            = 136
	OpChangeGuildTax                                                      = 137
	OpGetMyTerritories                                                    = 138
	OpMorganaCommand                                                      = 139
	OpGetServerInfo                                                       = 140
	OpSubscribeToCluster                                                  = 141
	OpAnswerMercenaryInvitation                                           = 142
	OpGetCharacterEquipment                                               = 143
	OpGetCharacterSteamAchievements                                       = 144
	OpGetCharacterStats                                                   = 145
	OpGetKillHistoryDetails                                               = 146
	OpReSpecAchievement                                                   = 147
	OpChangeAvatar                                                        = 148
	OpGetRankings                                                         = 149
	OpGetRank                                                             = 150
	OpGetGvgSeasonRankings                                                = 151
	OpGetGvgSeasonRank                                                    = 152
	OpGetGvgSeasonHistoryRankings                                         = 153
	OpGetGvgSeasonGuildMemberHistory                                      = 154
	OpKickFromGvGMatch                                                    = 155
	OpGetCrystalLeagueDailySeasonPoints                                   = 156
	OpGetChestLogs                                                        = 157
	OpGetAccessRightLogs                                                  = 158
	OpGetGuildAccountLogs                                                 = 159
	OpGetGuildAccountLogsLargeAmount                                      = 160
	OpInviteToPlayerTrade                                                 = 161
	OpPlayerTradeCancel                                                   = 162
	OpPlayerTradeInvitationAccept                                         = 163
	OpPlayerTradeAddItem                                                  = 164
	OpPlayerTradeRemoveItem                                               = 165
	OpPlayerTradeAcceptTrade                                              = 166
	OpPlayerTradeSetSilverOrGold                                          = 167
	OpSendMiniMapPing                                                     = 168
	OpStuck                                                               = 169
	OpBuyRealEstate                                                       = 170
	OpClaimRealEstate                                                     = 171
	OpGiveUpRealEstate                                                    = 172
	OpChangeRealEstateOutline                                             = 173
	OpGetMailInfos                                                        = 174
	OpGetMailCount                                                        = 175
	OpReadMail                                                            = 176
	OpSendNewMail                                                         = 177
	OpDeleteMail                                                          = 178
	OpMarkMailUnread                                                      = 179
	OpClaimAttachmentFromMail                                             = 180
	OpApplyToGuild                                                        = 181
	OpAnswerGuildApplication                                              = 182
	OpRequestGuildFinderFilteredList                                      = 183
	OpUpdateGuildRecruitmentInfo                                          = 184
	OpRequestGuildRecruitmentInfo                                         = 185
	OpRequestGuildFinderNameSearch                                        = 186
	OpRequestGuildFinderRecommendedList                                   = 187
	OpRegisterChatPeer                                                    = 188
	OpSendChatMessage                                                     = 189
	OpSendModeratorMessage                                                = 190
	OpJoinChatChannel                                                     = 191
	OpLeaveChatChannel                                                    = 192
	OpSendWhisperMessage                                                  = 193
	OpSay                                                                 = 194
	OpPlayEmote                                                           = 195
	OpStopEmote                                                           = 196
	OpGetClusterMapInfo                                                   = 197
	OpAccessRightsChangeSettings                                          = 198
	OpMount                                                               = 199
	OpMountCancel                                                         = 200
	OpBuyJourney                                                          = 201
	OpSetSaleStatusForEstate                                              = 202
	OpResolveGuildOrPlayerName                                            = 203
	OpGetRespawnInfos                                                     = 204
	OpMakeHome                                                            = 205
	OpLeaveHome                                                           = 206
	OpResurrectionReply                                                   = 207
	OpAllianceCreate                                                      = 208
	OpAllianceDisband                                                     = 209
	OpAllianceGetMemberInfos                                              = 210
	OpAllianceInvite                                                      = 211
	OpAllianceAnswerInvitation                                            = 212
	OpAllianceCancelInvitation                                            = 213
	OpAllianceKickGuild                                                   = 214
	OpAllianceLeave                                                       = 215
	OpAllianceChangeGoldPaymentFlag                                       = 216
	OpAllianceGetDetailInfo                                               = 217
	OpGetIslandInfos                                                      = 218
	OpBuyMyIsland                                                         = 219
	OpBuyGuildIsland                                                      = 220
	OpUpgradeMyIsland                                                     = 221
	OpUpgradeGuildIsland                                                  = 222
	OpTerritoryFillNutrition                                              = 223
	OpTeleportBack                                                        = 224
	OpPartyInvitePlayer                                                   = 225
	OpPartyRequestJoin                                                    = 226
	OpPartyAnswerInvitation                                               = 227
	OpPartyAnswerJoinRequest                                              = 228
	OpPartyLeave                                                          = 229
	OpPartyKickPlayer                                                     = 230
	OpPartyMakeLeader                                                     = 231
	OpPartyChangeLootSetting                                              = 232
	OpPartyMarkObject                                                     = 233
	OpPartySetRole                                                        = 234
	OpPartyChangeFactionWarfareRequestReinforcementsSetting               = 235
	OpSetGuildCodex                                                       = 236
	OpExitEnterStart                                                      = 237
	OpExitEnterCancel                                                     = 238
	OpQuestGiverRequest                                                   = 239
	OpGoldMarketGetBuyOffer                                               = 240
	OpGoldMarketGetBuyOfferFromSilver                                     = 241
	OpGoldMarketGetSellOffer                                              = 242
	OpGoldMarketGetSellOfferFromSilver                                    = 243
	OpGoldMarketBuyGold                                                   = 244
	OpGoldMarketSellGold                                                  = 245
	OpGoldMarketCreateSellOrder                                           = 246
	OpGoldMarketCreateBuyOrder                                            = 247
	OpGoldMarketGetInfos                                                  = 248
	OpGoldMarketCancelOrder                                               = 249
	OpGoldMarketGetAverageInfo                                            = 250
	OpTreasureChestUsingStart                                             = 251
	OpTreasureChestUsingCancel                                            = 252
	OpUseLootChest                                                        = 253
	OpUseShrine                                                           = 254
	OpUseHellgateShrine                                                   = 255
	OpGetSiegeBannerInfo                                                  = 256
	OpLaborerStartJob                                                     = 257
	OpLaborerTakeJobLoot                                                  = 258
	OpLaborerDismiss                                                      = 259
	OpLaborerMove                                                         = 260
	OpLaborerBuyItem                                                      = 261
	OpLaborerUpgrade                                                      = 262
	OpBuyPremium                                                          = 263
	OpRealEstateGetAuctionData                                            = 264
	OpRealEstateBidOnAuction                                              = 265
	OpFriendInvite                                                        = 266
	OpFriendAnswerInvitation                                              = 267
	OpFriendCancelnvitation                                               = 268
	OpFriendRemove                                                        = 269
	OpEquipmentItemChangeSpell                                            = 270
	OpExpeditionRegister                                                  = 271
	OpExpeditionRegisterCancel                                            = 272
	OpJoinExpedition                                                      = 273
	OpDeclineExpeditionInvitation                                         = 274
	OpVoteStart                                                           = 275
	OpVoteDoVote                                                          = 276
	OpRatingDoRate                                                        = 277
	OpEnteringExpeditionStart                                             = 278
	OpEnteringExpeditionCancel                                            = 279
	OpActivateExpeditionCheckPoint                                        = 280
	OpArenaRegister                                                       = 281
	OpArenaAddInvite                                                      = 282
	OpArenaRegisterCancel                                                 = 283
	OpArenaLeave                                                          = 284
	OpJoinArenaMatch                                                      = 285
	OpDeclineArenaInvitation                                              = 286
	OpEnteringArenaStart                                                  = 287
	OpEnteringArenaCancel                                                 = 288
	OpArenaCustomMatch                                                    = 289
	OpUpdateCharacterStatement                                            = 290
	OpBoostFarmable                                                       = 291
	OpGetStrikeHistory                                                    = 292
	OpUseFunction                                                         = 293
	OpUsePortalEntrance                                                   = 294
	OpResetPortalBinding                                                  = 295
	OpQueryPortalBinding                                                  = 296
	OpClaimPaymentTransaction                                             = 297
	OpChangeUseFlag                                                       = 298
	OpClientPerformanceStats                                              = 299
	OpExtendedHardwareStats                                               = 300
	OpClientLowMemoryWarning                                              = 301
	OpTerritoryClaimStart                                                 = 302
	OpTerritoryClaimCancel                                                = 303
	OpDeliverCarriableObjectStart                                         = 304
	OpDeliverCarriableObjectCancel                                        = 305
	OpTerritoryUpgradeWithPowerCrystal                                    = 306
	OpRequestAppStoreProducts                                             = 307
	OpVerifyProductPurchase                                               = 308
	OpQueryGuildPlayerStats                                               = 309
	OpQueryAllianceGuildStats                                             = 310
	OpTrackAchievements                                                   = 311
	OpSetAchievementsAutoLearn                                            = 312
	OpDepositItemToGuildCurrency                                          = 313
	OpWithdrawalItemFromGuildCurrency                                     = 314
	OpAuctionSellSpecificItemRequest                                      = 315
	OpFishingStart                                                        = 316
	OpFishingCasting                                                      = 317
	OpFishingCast                                                         = 318
	OpFishingCatch                                                        = 319
	OpFishingPull                                                         = 320
	OpFishingGiveLine                                                     = 321
	OpFishingFinish                                                       = 322
	OpFishingCancel                                                       = 323
	OpCreateGuildAccessTag                                                = 324
	OpDeleteGuildAccessTag                                                = 325
	OpRenameGuildAccessTag                                                = 326
	OpFlagGuildAccessTagGuildPermission                                   = 327
	OpAssignGuildAccessTag                                                = 328
	OpRemoveGuildAccessTagFromPlayer                                      = 329
	OpModifyGuildAccessTagEditors                                         = 330
	OpRequestPublicAccessTags                                             = 331
	OpChangeAccessTagPublicFlag                                           = 332
	OpUpdateGuildAccessTag                                                = 333
	OpSteamStartMicrotransaction                                          = 334
	OpSteamFinishMicrotransaction                                         = 335
	OpRequestXboxPurchaseIntent                                           = 336
	OpCloseXboxPurchaseIntent                                             = 337
	OpSteamIdHasActiveAccount                                             = 338
	OpCheckEmailAccountState                                              = 339
	OpLinkAccountToSteamId                                                = 340
	OpEpicIdHasActiveAccount                                              = 341
	OpLinkAccountToEpicId                                                 = 342
	OpXboxIdHasActiveAccount                                              = 343
	OpInAppConfirmPaymentGooglePlay                                       = 344
	OpInAppConfirmPaymentAppleAppStore                                    = 345
	OpInAppPurchaseRequest                                                = 346
	OpInAppPurchaseFailed                                                 = 347
	OpCharacterSubscriptionInfo                                           = 348
	OpAccountSubscriptionInfo                                             = 349
	OpBuyGvgSeasonBooster                                                 = 350
	OpChangeFlaggingPrepare                                               = 351
	OpOverCharge                                                          = 352
	OpOverChargeEnd                                                       = 353
	OpRequestTrusted                                                      = 354
	OpChangeGuildLogo                                                     = 355
	OpPartyFinderRegisterForUpdates                                       = 356
	OpPartyFinderUnregisterForUpdates                                     = 357
	OpPartyFinderEnlistNewPartySearch                                     = 358
	OpPartyFinderDeletePartySearch                                        = 359
	OpPartyFinderChangePartySearch                                        = 360
	OpPartyFinderChangeRole                                               = 361
	OpPartyFinderApplyForGroup                                            = 362
	OpPartyFinderAcceptOrDeclineApplyForGroup                             = 363
	OpPartyFinderGetEquipmentSnapshot                                     = 364
	OpPartyFinderRegisterApplicants                                       = 365
	OpPartyFinderUnregisterApplicants                                     = 366
	OpPartyFinderFulltextSearch                                           = 367
	OpPartyFinderRequestEquipmentSnapshot                                 = 368
	OpGetPersonalSeasonTrackerData                                        = 369
	OpGetPersonalSeasonPastRewardData                                     = 370
	OpUseConsumableFromInventory                                          = 371
	OpClaimPersonalSeasonReward                                           = 372
	OpXignCodeMessageToServer                                             = 373
	OpBattlEyeMessageToServer                                             = 374
	OpSetNextTutorialState                                                = 375
	OpAddPlayerToMuteList                                                 = 376
	OpRemovePlayerFromMuteList                                            = 377
	OpProductShopUserEvent                                                = 378
	OpGetVanityUnlocks                                                    = 379
	OpBuyVanityUnlocks                                                    = 380
	OpGetMountSkins                                                       = 381
	OpSetMountSkin                                                        = 382
	OpSetWardrobe                                                         = 383
	OpChangeCustomization                                                 = 384
	OpChangePlayerIslandData                                              = 385
	OpGetGuildChallengePoints                                             = 386
	OpSmartQueueJoin                                                      = 387
	OpSmartQueueLeave                                                     = 388
	OpSmartQueueSelectSpawnCluster                                        = 389
	OpUpgradeHideout                                                      = 390
	OpInitHideoutAttackStart                                              = 391
	OpInitHideoutAttackCancel                                             = 392
	OpHideoutFillNutrition                                                = 393
	OpHideoutGetInfo                                                      = 394
	OpHideoutGetOwnerInfo                                                 = 395
	OpHideoutSetTribute                                                   = 396
	OpHideoutUpgradeWithPowerCrystal                                      = 397
	OpHideoutDeclareHQ                                                    = 398
	OpHideoutUndeclareHQ                                                  = 399
	OpHideoutGetHQRequirements                                            = 400
	OpHideoutBoost                                                        = 401
	OpHideoutBoostConstruction                                            = 402
	OpOpenWorldAttackScheduleStart                                        = 403
	OpOpenWorldAttackScheduleCancel                                       = 404
	OpOpenWorldAttackConquerStart                                         = 405
	OpOpenWorldAttackConquerCancel                                        = 406
	OpGetOpenWorldAttackDetails                                           = 407
	OpGetNextOpenWorldAttackScheduleTime                                  = 408
	OpRecoverVaultFromHideout                                             = 409
	OpGetGuildEnergyDrainInfo                                             = 410
	OpChannelingUpdate                                                    = 411
	OpUseCorruptedShrine                                                  = 412
	OpRequestEstimatedMarketValue                                         = 413
	OpLogFeedback                                                         = 414
	OpGetInfamyInfo                                                       = 415
	OpGetPartySmartClusterQueuePriority                                   = 416
	OpSetPartySmartClusterQueuePriority                                   = 417
	OpClientAntiAutoClickerInfo                                           = 418
	OpClientBotPatternDetectionInfo                                       = 419
	OpClientAntiGatherClickerInfo                                         = 420
	OpLoadoutCreate                                                       = 421
	OpLoadoutRead                                                         = 422
	OpLoadoutReadHeaders                                                  = 423
	OpLoadoutUpdate                                                       = 424
	OpLoadoutDelete                                                       = 425
	OpLoadoutOrderUpdate                                                  = 426
	OpLoadoutEquip                                                        = 427
	OpBatchUseItemCancel                                                  = 428
	OpEnlistFactionWarfare                                                = 429
	OpGetFactionWarfareWeeklyReport                                       = 430
	OpClaimFactionWarfareWeeklyReport                                     = 431
	OpGetFactionWarfareCampaignData                                       = 432
	OpClaimFactionWarfareItemReward                                       = 433
	OpSendMemoryConsumption                                               = 434
	OpPickupCarriableObjectStart                                          = 435
	OpPickupCarriableObjectCancel                                         = 436
	OpSetSavingChestLogsFlag                                              = 437
	OpGetSavingChestLogsFlag                                              = 438
	OpRegisterGuestAccount                                                = 439
	OpResendGuestAccountVerificationEmail                                 = 440
	OpDoSimpleActionStart                                                 = 441
	OpDoSimpleActionCancel                                                = 442
	OpGetGvgSeasonContributionByActivity                                  = 443
	OpGetGvgSeasonContributionByCrystalLeague                             = 444
	OpGetGuildMightCategoryContribution                                   = 445
	OpGetGuildMightCategoryOverview                                       = 446
	OpGetPvpChallengeData                                                 = 447
	OpClaimPvpChallengeWeeklyReward                                       = 448
	OpGetPersonalMightStats                                               = 449
	OpGetPvpChallengeSeasonRewards                                        = 450
	OpGetPvpChallengeSeasonRewardItems                                    = 451
	OpClaimPvpChallengeSeasonRewards                                      = 452
	OpClaimPvpChallengeSeasonRewardItems                                  = 453
	OpAuctionGetLoadoutOffers                                             = 454
	OpAuctionBuyLoadoutOffer                                              = 455
	OpAccountDeletionRequest                                              = 456
	OpAccountReactivationRequest                                          = 457
	OpCreateModeratorNotesForAccount                                      = 458
	OpGetModeratorNotesForAccount                                         = 459
	OpGetModerationEscalationDefiniton                                    = 460
	OpEventBasedPopupAddSeen                                              = 461
	OpGetItemKillHistory                                                  = 462
	OpGetVanityConsumables                                                = 463
	OpEquipKillEmote                                                      = 464
	OpChangeKillEmotePlayOnKnockdownSetting                               = 465
	OpBuyVanityConsumableCharges                                          = 466
	OpReclaimVanityItem                                                   = 467
	OpGetArenaRankings                                                    = 468
	OpGetCrystalLeagueStatistics                                          = 469
	OpSendOptionsLog                                                      = 470
	OpSendControlsOptionsLog                                              = 471
	OpMistsUseImmediateReturnExit                                         = 472
	OpMistsUseStaticEntrance                                              = 473
	OpMistsUseCityRoadsEntrance                                           = 474
	OpChangeNewGuildMemberMail                                            = 475
	OpGetNewGuildMemberMail                                               = 476
	OpChangeGuildFactionAllegiance                                        = 477
	OpGetGuildFactionAllegiance                                           = 478
	OpGuildBannerChange                                                   = 479
	OpGuildGetOptionalStats                                               = 480
	OpGuildSetOptionalStats                                               = 481
	OpGetPlayerInfoForStalk                                               = 482
	OpPayGoldForCharacterTypeChange                                       = 483
	OpQuickSellAuctionQueryAction                                         = 484
	OpQuickSellAuctionSellAction                                          = 485
	OpFcmTokenToServer                                                    = 486
	OpApnsTokenToServer                                                   = 487
	OpDeathRecap                                                          = 488
	OpAuctionFetchFinishedAuctions                                        = 489
	OpAbortAuctionFetchFinishedAuctions                                   = 490
	OpRequestLegendaryEvenHistory                                         = 491
	OpPartyAnswerStartHuntRequest                                         = 492
	OpHuntAbort                                                           = 493
	OpUseFindTrackSpellFromItemPrepare                                    = 494
	OpInteractWithTrackStart                                              = 495
	OpInteractWithTrackCancel                                             = 496
	OpTerritoryRaidStart                                                  = 497
	OpTerritoryRaidCancel                                                 = 498
	OpTerritoryClaimRaidedRawEnergyCrystalResult                          = 499
	OpGvGSeasonPlayerGuildParticipationDetails                            = 500
	OpDailyMightBonus                                                     = 501
	OpClaimDailyMightBonus                                                = 502
	OpGetFortificationGroupInfo                                           = 503
	OpUpgradeFortificationGroup                                           = 504
	OpCancelUpgradeFortificationGroup                                     = 505
	OpDowngradeFortificationGroup                                         = 506
	OpGetClusterActivityChestEstimates                                    = 507
	OpPartyReadyCheckBegin                                                = 508
	OpPartyReadyCheckUpdate                                               = 509
	OpClaimAlbionJournalReward                                            = 510
	OpTrackAlbionJournalAchievements                                      = 511
	OpTrackAlbionJournalAchievementSubCategory                            = 512
	OpRequestOutlandsTeleportationUsage                                   = 513
	OpPickupFromPiledObjectStart                                          = 514
	OpPickupFromPiledObjectCancel                                         = 515
	OpAssetOverview                                                       = 516
	OpAssetOverviewTabs                                                   = 517
	OpAssetOverviewTabContent                                             = 518
	OpAssetOverviewUnfreezeCache                                          = 519
	OpAssetOverviewSearch                                                 = 520
	OpAssetOverviewSearchTabs                                             = 521
	OpAssetOverviewSearchTabContent                                       = 522
	OpAssetOverviewRecoverPlayerVault                                     = 523
	OpImmortalizeKillTrophy                                               = 524
	OpArmorySearch                                                        = 525
	OpArmoryItemUsageStatistics                                           = 526
	OpArmoryActivityUsageStatistics                                       = 527
	OpHellDungeonUseStaticEntrance                                        = 528
	OpTravelIslandShowroom                                                = 529
	OpGetXuids                                                            = 530
	OpXboxServiceTicket                                                   = 531
	OpEvaluatePlatformPerks                                               = 532
	OpLinkAccountToXbox                                                   = 533
	OpTravelFactionWarfarePortal                                          = 534
	OpRequestRedZoneEventStandings                                        = 535
	OpGetZergDebuffInfo                                                   = 536
	OpRequestLoreSnippetStates                                            = 537
	OpRetrieveCarriableObjectStart                                        = 538
	OpRetrieveCarriableObjectCancel                                       = 539
)

// EventType used to identify event types
//
//go:generate stringer -type=EventType
type EventType uint16

const (
	EvUnused EventType = iota
	EvLeave
	EvJoinFinished
	EvMove
	EvTeleport
	EvChangeEquipment
	EvHealthUpdate
	EvHealthUpdates
	EvEnergyUpdate
	EvDamageShieldUpdate
	EvCraftingFocusUpdate
	EvActiveSpellEffectsUpdate
	EvResetCooldowns
	EvAttack
	EvCastStart
	EvChannelingUpdate
	EvCastCancel
	EvCastTimeUpdate
	EvCastFinished
	EvCastSpell
	EvCastSpells
	EvCastHit
	EvCastHits
	EvStoredTargetsUpdate
	EvChannelingEnded
	EvAttackBuilding
	EvInventoryPutItem
	EvInventoryDeleteItem
	EvInventoryState
	EvNewCharacter
	EvNewEquipmentItem
	EvNewSiegeBannerItem
	EvNewSimpleItem
	EvNewFurnitureItem
	EvNewKillTrophyItem
	EvNewJournalItem
	EvNewLaborerItem
	EvNewEquipmentItemLegendarySoul
	EvNewSimpleHarvestableObject
	EvNewSimpleHarvestableObjectList
	EvNewHarvestableObject
	EvNewTreasureDestinationObject
	EvTreasureDestinationObjectStatus
	EvCloseTreasureDestinationObject
	EvNewSilverObject
	EvNewBuilding
	EvHarvestableChangeState
	EvMobChangeState
	EvFactionBuildingInfo
	EvCraftBuildingInfo
	EvRepairBuildingInfo
	EvMeldBuildingInfo
	EvConstructionSiteInfo
	EvPlayerBuildingInfo
	EvFarmBuildingInfo
	EvTutorialBuildingInfo
	EvLaborerObjectInfo
	EvLaborerObjectJobInfo
	EvMarketPlaceBuildingInfo
	EvHarvestStart
	EvHarvestCancel
	EvHarvestFinished
	EvTakeSilver
	EvRemoveSilver
	EvActionOnBuildingStart
	EvActionOnBuildingCancel
	EvActionOnBuildingFinished
	EvItemRerollQualityFinished
	EvInstallResourceStart
	EvInstallResourceCancel
	EvInstallResourceFinished
	EvCraftItemFinished
	EvLogoutCancel
	EvChatMessage
	EvChatSay
	EvChatWhisper
	EvChatMuted
	EvPlayEmote
	EvStopEmote
	EvSystemMessage
	EvUtilityTextMessage
	EvUpdateMoney
	EvUpdateFame
	EvUpdateLearningPoints
	EvUpdateReSpecPoints
	EvUpdateCurrency
	EvUpdateFactionStanding
	EvUpdateStanding
	EvRespawn
	EvServerDebugLog
	EvCharacterEquipmentChanged
	EvRegenerationHealthChanged
	EvRegenerationEnergyChanged
	EvRegenerationMountHealthChanged
	EvRegenerationCraftingChanged
	EvRegenerationHealthEnergyComboChanged
	EvRegenerationPlayerComboChanged
	EvDurabilityChanged
	EvNewLoot
	EvAttachItemContainer
	EvDetachItemContainer
	EvInvalidateItemContainer
	EvLockItemContainer
	EvGuildUpdate
	EvGuildPlayerUpdated
	EvInvitedToGuild
	EvGuildMemberWorldUpdate
	EvUpdateMatchDetails
	EvObjectEvent
	EvNewMonolithObject
	EvMonolithHasBannersPlacedUpdate
	EvNewOrbObject
	EvNewCastleObject
	EvNewSpellEffectArea
	EvUpdateSpellEffectArea
	EvNewChainSpell
	EvUpdateChainSpell
	EvNewTreasureChest
	EvStartMatch
	EvStartArenaMatchInfos
	EvEndArenaMatch
	EvMatchUpdate
	EvActiveMatchUpdate
	EvNewMob
	EvDebugMobInfo
	EvDebugVariablesInfo
	EvDebugReputationInfo
	EvDebugDiminishingReturnInfo
	EvDebugSmartClusterQueueInfo
	EvClaimOrbStart
	EvClaimOrbFinished
	EvClaimOrbCancel
	EvOrbUpdate
	EvOrbClaimed
	EvOrbReset
	EvNewWarCampObject
	EvNewMatchLootChestObject
	EvNewArenaExit
	EvGuildMemberTerritoryUpdate
	EvInvitedMercenaryToMatch
	EvClusterInfoUpdate
	EvForcedMovement
	EvForcedMovementCancel
	EvCharacterStats
	EvCharacterStatsKillHistory
	EvCharacterStatsDeathHistory
	EvCharacterStatsKnockDownHistory
	EvCharacterStatsKnockedDownHistory
	EvGuildStats
	EvKillHistoryDetails
	EvItemKillHistoryDetails
	EvFullAchievementInfo
	EvFinishedAchievement
	EvAchievementProgressInfo
	EvFullAchievementProgressInfo
	EvFullTrackedAchievementInfo
	EvFullAutoLearnAchievementInfo
	EvQuestGiverQuestOffered
	EvQuestGiverDebugInfo
	EvConsoleEvent
	EvTimeSync
	EvChangeAvatar
	EvChangeMountSkin
	EvGameEvent
	EvKilledPlayer
	EvDied
	EvKnockedDown
	EvUnconcious
	EvMatchPlayerJoinedEvent
	EvMatchPlayerStatsEvent
	EvMatchPlayerStatsCompleteEvent
	EvMatchTimeLineEventEvent
	EvMatchNewCombatRound
	EvMatchEndCombatRound
	EvMatchPlayerMainGearStatsEvent
	EvMatchPlayerChangedAvatarEvent
	EvInvitationPlayerTrade
	EvPlayerTradeStart
	EvPlayerTradeCancel
	EvPlayerTradeUpdate
	EvPlayerTradeFinished
	EvPlayerTradeAcceptChange
	EvMiniMapPing
	EvMarketPlaceNotification
	EvDuellingChallengePlayer
	EvNewDuellingPost
	EvDuelStarted
	EvDuelEnded
	EvDuelDenied
	EvDuelRequestCanceled
	EvDuelLeftArea
	EvDuelReEnteredArea
	EvNewRealEstate
	EvMiniMapOwnedBuildingsPositions
	EvRealEstateListUpdate
	EvGuildLogoUpdate
	EvGuildLogoChanged
	EvPlaceableObjectPlace
	EvPlaceableObjectPlaceCancel
	EvFurnitureObjectBuffProviderInfo
	EvFurnitureObjectCheatProviderInfo
	EvFarmableObjectInfo
	EvNewUnreadMails
	EvMailOperationPossible
	EvGuildLogoObjectUpdate
	EvStartLogout
	EvNewChatChannels
	EvJoinedChatChannel
	EvLeftChatChannel
	EvRemovedChatChannel
	EvAccessStatus
	EvMounted
	EvMountStart
	EvMountCancel
	EvNewTravelpoint
	EvNewIslandAccessPoint
	EvNewExit
	EvUpdateHome
	EvUpdateChatSettings
	EvResurrectionOffer
	EvResurrectionReply
	EvLootEquipmentChanged
	EvUpdateUnlockedGuildLogos
	EvUpdateUnlockedAvatars
	EvUpdateUnlockedAvatarRings
	EvUpdateUnlockedBuildings
	EvNewIslandManagement
	EvNewTeleportStone
	EvCloak
	EvPartyInvitation
	EvPartyJoinRequest
	EvPartyJoined
	EvPartyDisbanded
	EvPartyPlayerJoined
	EvPartyChangedOrder
	EvPartyPlayerLeft
	EvPartyLeaderChanged
	EvPartyLootSettingChangedPlayer
	EvPartySilverGained
	EvPartyPlayerUpdated
	EvPartyInvitationAnswer
	EvPartyJoinRequestAnswer
	EvPartyMarkedObjectsUpdated
	EvPartyOnClusterPartyJoined
	EvPartySetRoleFlag
	EvPartyInviteOrJoinPlayerEquipmentInfo
	EvPartyReadyCheckUpdate
	EvPartyFactionWarfareReinforcementSettingChangedPlayer
	EvSpellCooldownUpdate
	EvNewHellgateExitPortal
	EvNewExpeditionExit
	EvNewExpeditionNarrator
	EvExitEnterStart
	EvExitEnterCancel
	EvExitEnterFinished
	EvNewQuestGiverObject
	EvFullQuestInfo
	EvQuestProgressInfo
	EvQuestGiverInfoForPlayer
	EvFullExpeditionInfo
	EvExpeditionQuestProgressInfo
	EvInvitedToExpedition
	EvExpeditionRegistrationInfo
	EvEnteringExpeditionStart
	EvEnteringExpeditionCancel
	EvRewardGranted
	EvArenaRegistrationInfo
	EvEnteringArenaStart
	EvEnteringArenaCancel
	EvEnteringArenaLockStart
	EvEnteringArenaLockCancel
	EvInvitedToArenaMatch
	EvUsingHellgateShrine
	EvEnteringHellgateLockStart
	EvEnteringHellgateLockCancel
	EvPlayerCounts
	EvInCombatStateUpdate
	EvOtherGrabbedLoot
	EvTreasureChestUsingStart
	EvTreasureChestUsingFinished
	EvTreasureChestUsingCancel
	EvTreasureChestUsingOpeningComplete
	EvTreasureChestForceCloseInventory
	EvLocalTreasuresUpdate
	EvLootChestSpawnpointsUpdate
	EvPremiumChanged
	EvPremiumExtended
	EvPremiumLifeTimeRewardGained
	EvGoldPurchased
	EvLaborerGotUpgraded
	EvJournalGotFull
	EvJournalFillError
	EvFriendRequest
	EvFriendRequestInfos
	EvFriendInfos
	EvFriendRequestAnswered
	EvFriendOnlineStatus
	EvFriendRequestCanceled
	EvFriendRemoved
	EvFriendUpdated
	EvPartyLootItems
	EvPartyLootItemsRemoved
	EvPartyLootItemTypesRemoved
	EvReputationUpdate
	EvDefenseUnitAttackBegin
	EvDefenseUnitAttackEnd
	EvDefenseUnitAttackDamage
	EvUnrestrictedPvpZoneUpdate
	EvUnrestrictedPvpZoneStatus
	EvReputationImplicationUpdate
	EvNewMountObject
	EvMountHealthUpdate
	EvMountCooldownUpdate
	EvNewExpeditionAgent
	EvNewExpeditionCheckPoint
	EvExpeditionStartEvent
	EvVoteEvent
	EvRatingEvent
	EvNewArenaAgent
	EvBoostFarmable
	EvUseFunction
	EvNewPortalEntrance
	EvNewPortalExit
	EvNewRandomDungeonExit
	EvWaitingQueueUpdate
	EvPlayerMovementRateUpdate
	EvObserveStart
	EvMinimapZergs
	EvMinimapSmartClusterZergs
	EvPaymentTransactions
	EvPerformanceStatsUpdate
	EvOverloadModeUpdate
	EvDebugDrawEvent
	EvRecordCameraMove
	EvRecordStart
	EvDeliverCarriableObjectStart
	EvDeliverCarriableObjectCancel
	EvDeliverCarriableObjectReset
	EvDeliverCarriableObjectFinished
	EvTerritoryClaimStart
	EvTerritoryClaimCancel
	EvTerritoryClaimFinished
	EvTerritoryScheduleResult
	EvTerritoryUpgradeWithPowerCrystalResult
	EvReceiveCarriableObjectStart
	EvReceiveCarriableObjectFinished
	EvUpdateAccountState
	EvStartDeterministicRoam
	EvGuildFullAccessTagsUpdated
	EvGuildAccessTagUpdated
	EvGvgSeasonUpdate
	EvGvgSeasonCheatCommand
	EvSeasonPointsByKillingBooster
	EvFishingStart
	EvFishingCast
	EvFishingCatch
	EvFishingFinished
	EvFishingCancel
	EvNewFloatObject
	EvNewFishingZoneObject
	EvFishingMiniGame
	EvAlbionJournalAchievementCompleted
	EvUpdatePuppet
	EvChangeFlaggingFinished
	EvNewOutpostObject
	EvOutpostUpdate
	EvOutpostClaimed
	EvOverChargeEnd
	EvOverChargeStatus
	EvPartyFinderFullUpdate
	EvPartyFinderUpdate
	EvPartyFinderApplicantsUpdate
	EvPartyFinderEquipmentSnapshot
	EvPartyFinderJoinRequestDeclined
	EvNewUnlockedPersonalSeasonRewards
	EvPersonalSeasonPointsGained
	EvPersonalSeasonPastSeasonDataEvent
	EvMatchLootChestOpeningStart
	EvMatchLootChestOpeningFinished
	EvMatchLootChestOpeningCancel
	EvNotifyCrystalMatchReward
	EvCrystalRealmFeedback
	EvNewLocationMarker
	EvNewTutorialBlocker
	EvNewTileSwitch
	EvNewInformationProvider
	EvNewDynamicGuildLogo
	EvNewDecoration
	EvTutorialUpdate
	EvTriggerHintBox
	EvRandomDungeonPositionInfo
	EvNewLootChest
	EvUpdateLootChest
	EvLootChestOpened
	EvUpdateLootProtectedByMobsWithMinimapDisplay
	EvNewShrine
	EvUpdateShrine
	EvUpdateRoom
	EvNewMobSoul
	EvNewHellgateShrine
	EvUpdateHellgateShrine
	EvActivateHellgateExit
	EvMutePlayerUpdate
	EvShopTileUpdate
	EvShopUpdate
	EvAntiCheatKick
	EvBattlEyeServerMessage
	EvUnlockVanityUnlock
	EvAvatarUnlocked
	EvCustomizationChanged
	EvBaseVaultInfo
	EvGuildVaultInfo
	EvBankVaultInfo
	EvRecoveryVaultPlayerInfo
	EvRecoveryVaultGuildInfo
	EvUpdateWardrobe
	EvCastlePhaseChanged
	EvGuildAccountLogEvent
	EvNewHideoutObject
	EvNewHideoutManagement
	EvNewHideoutExit
	EvInitHideoutAttackStart
	EvInitHideoutAttackCancel
	EvInitHideoutAttackFinished
	EvHideoutManagementUpdate
	EvHideoutUpgradeWithPowerCrystalResult
	EvIpChanged
	EvSmartClusterQueueUpdateInfo
	EvSmartClusterQueueActiveInfo
	EvSmartClusterQueueKickWarning
	EvSmartClusterQueueInvite
	EvReceivedGvgSeasonPoints
	EvTowerPowerPointUpdate
	EvOpenWorldAttackScheduleStart
	EvOpenWorldAttackScheduleFinished
	EvOpenWorldAttackScheduleCancel
	EvOpenWorldAttackConquerStart
	EvOpenWorldAttackConquerFinished
	EvOpenWorldAttackConquerCancel
	EvOpenWorldAttackConquerStatus
	EvOpenWorldAttackStart
	EvOpenWorldAttackEnd
	EvNewRandomResourceBlocker
	EvNewHomeObject
	EvHideoutObjectUpdate
	EvUpdateInfamy
	EvMinimapPositionMarkers
	EvNewTunnelExit
	EvCorruptedDungeonUpdate
	EvCorruptedDungeonStatus
	EvCorruptedDungeonInfamy
	EvHellgateRestrictedAreaUpdate
	EvHellgateInfamy
	EvHellgateStatus
	EvHellgateStatusUpdate
	EvHellgateSuspense
	EvReplaceSpellSlotWithMultiSpell
	EvNewCorruptedShrine
	EvUpdateCorruptedShrine
	EvCorruptedShrineUsageStart
	EvCorruptedShrineUsageCancel
	EvExitUsed
	EvLinkedToObject
	EvLinkToObjectBroken
	EvEstimatedMarketValueUpdate
	EvStuckCancel
	EvDungonEscapeReady
	EvFactionWarfareClusterState
	EvFactionWarfareHasUnclaimedWeeklyReportsEvent
	EvSimpleFeedback
	EvSmartClusterQueueSkipClusterError
	EvXignCodeEvent
	EvBatchUseItemStart
	EvBatchUseItemEnd
	EvRedZonePlayerNotification
	EvRedZoneEventCheatCleanup
	EvRedZoneFortressEventChestOpened
	EvRedZoneWorldMapEvent
	EvFactionWarfareStats
	EvUpdateFactionBalanceFactors
	EvFactionEnlistmentChanged
	EvUpdateFactionRank
	EvFactionWarfareCampaignRewardsUnlocked
	EvFeaturedFeatureUpdate
	EvNewCarriableObject
	EvMinimapCrystalPositionMarker
	EvCarriedObjectUpdate
	EvPickupCarriableObjectStart
	EvPickupCarriableObjectCancel
	EvPickupCarriableObjectFinished
	EvDoSimpleActionStart
	EvDoSimpleActionCancel
	EvDoSimpleActionFinished
	EvNotifyGuestAccountVerified
	EvMightAndFavorReceivedEvent
	EvWeeklyPvpChallengeRewardStateUpdate
	EvNewUnlockedPvpSeasonChallengeRewards
	EvStaticDungeonEntrancesDungeonEventStatusUpdates
	EvStaticDungeonDungeonValueUpdate
	EvStaticDungeonEntranceDungeonEventsAborted
	EvInAppPurchaseConfirmedGooglePlay
	EvFeatureSwitchInfo
	EvPartyJoinRequestAborted
	EvPartyInviteAborted
	EvPartyStartHuntRequest
	EvPartyStartHuntRequested
	EvPartyStartHuntRequestAnswer
	EvPartyPlayerLeaveScheduled
	EvGuildInviteDeclined
	EvCancelMultiSpellSlots
	EvNewVisualEventObject
	EvCastleClaimProgress
	EvCastleClaimProgressLogo
	EvTownPortalUpdateState
	EvTownPortalFailed
	EvConsumableVanityChargesAdded
	EvFestivitiesUpdate
	EvNewBannerObject
	EvNewMistsImmediateReturnExit
	EvMistsPlayerJoinedInfo
	EvNewMistsStaticEntrance
	EvNewMistsOpenWorldExit
	EvNewTunnelExitTemp
	EvNewMistsWispSpawn
	EvMistsWispSpawnStateChange
	EvNewMistsCityEntrance
	EvNewMistsCityRoadsEntrance
	EvMistsCityRoadsEntrancePartyStateUpdate
	EvMistsCityRoadsEntranceClearStateForParty
	EvMistsEntranceDataChanged
	EvNewCagedObject
	EvCagedObjectStateUpdated
	EvEntrancePartyBindingCreated
	EvEntrancePartyBindingCleared
	EvEntrancePartyBindingInfos
	EvNewMistsBorderExit
	EvNewMistsDungeonExit
	EvLocalQuestInfos
	EvLocalQuestStarted
	EvLocalQuestActive
	EvLocalQuestInactive
	EvLocalQuestProgressUpdate
	EvNewUnrestrictedPvpZone
	EvTemporaryFlaggingStatusUpdate
	EvSpellTestPerformanceUpdate
	EvTransformation
	EvTransformationEnd
	EvUpdateTrustlevel
	EvRevealHiddenTimeStamps
	EvModifyItemTraitFinished
	EvRerollItemTraitValueFinished
	EvHuntQuestProgressInfo
	EvHuntStarted
	EvHuntFinished
	EvHuntAborted
	EvHuntMissionStepStateUpdate
	EvNewHuntTrack
	EvHuntMissionUpdate
	EvHuntQuestMissionProgressUpdate
	EvHuntTrackUsed
	EvHuntTrackUseableAgain
	EvMinimapHuntTrackMarkers
	EvNoTracksFound
	EvHuntQuestAborted
	EvInteractWithTrackStart
	EvInteractWithTrackCancel
	EvInteractWithTrackFinished
	EvNewDynamicCompound
	EvLegendaryItemDestroyed
	EvAttunementInfo
	EvTerritoryClaimRaidedRawEnergyCrystalResult
	EvCarriedObjectExpiryWarning
	EvCarriedObjectExpired
	EvTerritoryRaidStart
	EvTerritoryRaidCancel
	EvTerritoryRaidFinished
	EvTerritoryRaidResult
	EvTerritoryMonolithActiveRaidStatus
	EvTerritoryMonolithActiveRaidCancelled
	EvMonolithEnergyStorageUpdate
	EvMonolithNextScheduledOpenWorldAttackUpdate
	EvMonolithProtectedBuildingsDamageReductionUpdate
	EvNewBuildingBaseEvent
	EvNewFortificationBuilding
	EvNewCastleGateBuilding
	EvBuildingDurabilityUpdate
	EvMonolithFortificationPointsUpdate
	EvFortificationBuildingUpgradeInfo
	EvFortificationBuildingsDamageStateUpdate
	EvSiegeNotificationEvent
	EvUpdateEnemyWarBannerActive
	EvTerritoryAnnouncePlayerEjection
	EvCastleGateSwitchUseStarted
	EvCastleGateSwitchUseFinished
	EvFortificationBuildingWillDowngrade
	EvBotCommand
	EvJournalAchievementProgressUpdate
	EvJournalClaimableRewardUpdate
	EvKeySync
	EvLocalQuestAreaGone
	EvDynamicTemplate
	EvDynamicTemplateForcedStateChange
	EvNewOutlandsTeleportationPortal
	EvNewOutlandsTeleportationReturnPortal
	EvOutlandsTeleportationBindingCleared
	EvOutlandsTeleportationReturnPortalUpdateEvent
	EvPlayerUsedOutlandsTeleportationPortal
	EvEncumberedRestricted
	EvNewPiledObject
	EvPiledObjectStateChanged
	EvNewSmugglerCrateDeliveryStation
	EvKillRewardedNoFame
	EvPickupFromPiledObjectStart
	EvPickupFromPiledObjectCancel
	EvPickupFromPiledObjectReset
	EvPickupFromPiledObjectFinished
	EvArmoryActivityChange
	EvNewKillTrophyFurnitureBuilding
	EvHellDungeonsPlayerJoinedInfo
	EvNewTileSwitchTrigger
	EvNewMultiRewardObject
	EvNewHellDungeonSoulShrineObject
	EvHellDungeonSoulShrineStateUpdate
	EvNewResurrectionShrine
	EvUpdateResurrectionShrine
	EvStandTimeFinished
	EvEpicAchievementAndStatsUpdate
	EvSpectateTargetAfterDeathUpdate
	EvSpectateTargetAfterDeathEnded
	EvNewHellDungeonUpwardExit
	EvNewHellDungeonSoulExit
	EvNewHellDungeonDownwardExit
	EvNewHellDungeonChestExit
	EvNewCorruptedStaticEntrance
	EvNewHellDungeonStaticEntrance
	EvUpdateHellDungeonStaticEntranceState
	EvDebugTriggerHellDungeonShutdownStart
	EvFullJournalQuestInfo
	EvJournalQuestProgressInfo
	EvNewHellDungeonRoomShrineObject
	EvHellDungeonRoomShrineStateUpdate
	EvSimpleBehaviourBuildingStateUpdate
	EvSetTimeScaling
	EvStopTimeScaling
	EvKeyValidation
	EvPlayerJoinMapMarkerTimerStates
	EvNewMapMarkerTimer
	EvRemoveMapMarkerTimer
	EvNewFactionFortressObject
	EvFactionFortressAnnouncePlayerEjection
	EvRewardFactionWarfareSupply
	EvFactionCaptureAreaProgressUpdate
	EvFactionFortressClaimed
	EvFactionFortressWeaponCachesSpawned
	EvFactionFortressWeaponCacheClaimed
	EvFactionFortressFightStateUpdate
	EvFactionFortressCutoffFightStateUpdate
	EvFactionFortressFightEnded
	EvNewFactionWarfarePortal
	EvFactionPortalTargetUpdate
	EvFactionFortressFightStartedInRemoteClusterEvent
	EvFactionFortressFightFinishedInRemoteClusterEvent
	EvFactionDuchySupplyWarDefensiveVictoryEvent
	EvFactionDuchyReconnectedFromCutoffEvent
	EvFactionFortressCutoffFightCancelledByClusterOwnerChangeEvent
	EvFactionDuchyEnteredCutoffStateEvent
	EvLeaveProtectionStateUpdate
	EvRedZoneEventStandings
	EvNewFactionBattleStandardDeliveryStation
	EvNewLoreSnippetObject
	EvLoreSnippetObjectStateUpdate
	EvLoreSnippedClaimed
	EvLoreSnippetStatesChangedByCheat
	EvNewTeleporterNode
	EvTeleporterNodeStateChanged
	EvTeleporterConnectionsFullStateUpdate
	EvTeleporterConnectionStateChanged
	EvRetrieveCarriableObjectStart
	EvRetrieveCarriableObjectCancel
	EvRetrieveCarriableObjectReset
	EvRetrieveCarriableObjectFinished
	EvLosingCarriableObjectStart
	EvLosingCarriableObjectFinished
)

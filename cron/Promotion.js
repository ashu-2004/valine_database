const cron = require("node-cron");
const AM = require("../models/am");
const DM = require("../models/dm");
const CCM = require("../models/ccm");
const sequelize = require("../config/db");
const CCMDemotionTracker = require("../models/tracker");

const promoteDMsToCCM = async () => {
  try {
    const dmList = await DM.findAll();

    for (const dm of dmList) {
      const underDMs = await DM.findAll({ where: { parentdmId: dm.id } });

      if (underDMs.length >=2) {
        const t = await sequelize.transaction();

        try {
          // Step 1: Create a new CCM from the DM
          const newCCM = await CCM.create(
            {
              name: dm.name,
              email: dm.email,
              contact: dm.contact,
              password_hash: dm.password_hash,
              address: dm.address,
            },
            { transaction: t, hooks: false }
          );

          // Step 2: Update DMs under current DM
          for (const underDM of underDMs) {
            await underDM.update(
              {
                parentdmId: null,
                ccmId: newCCM.id,
              },
              { transaction: t }
            );
          }

          // Step 3: Track parent CCM for demotion if now it has < 10 DMs
          if (dm.ccmId) {
            const parentCCM = await CCM.findByPk(dm.ccmId, { transaction: t });

            if (parentCCM) {
              const dmCount = await DM.count({
                where: { ccmId: parentCCM.id },
                transaction: t,
              });

              if (dmCount < 2) {
                const alreadyTracked = await CCMDemotionTracker.findOne({
                  where: { ccmId: parentCCM.id },
                  transaction: t,
                });

                if (!alreadyTracked) {
                  await CCMDemotionTracker.create(
                    {
                      ccmId: parentCCM.id,
                      triggeredAt: new Date(),
                    },
                    { transaction: t }
                  );

                  console.log(
                    `⚠️ Tracked CCM ${parentCCM.id} for possible demotion (DMs: ${dmCount})`
                  );
                }
              }
            }
          }

          // Step 4: Reassign AMs to new DMs
          const amsUnderPromotedDM = await AM.findAll({
            where: { dmId: dm.id },
            transaction: t,
          });

          if (amsUnderPromotedDM.length > 0 && underDMs.length > 0) {
            let index = 0;
            for (const am of amsUnderPromotedDM) {
              const assignedDM = underDMs[index % underDMs.length];
              await am.update({ dmId: assignedDM.id }, { transaction: t });
              index++;
            }
          }

          // Optional: Update promoted DM to indicate status change
          await dm.update(
            {
              isPromoted: true, // You can add this column in the model if needed
              parentdmId: null,
            },
            { transaction: t }
          );
          await dm.destroy({ transaction: t });
          await t.commit();
          console.log(`✅ Promoted DM ${dm.id} to CCM successfully.`);
        } catch (error) {
          await t.rollback();
          console.error(`❌ Failed to promote DM ${dm.id}:`, error);
        }
      }
    }
  } catch (err) {
    console.error("🔥 Error in DM to CCM promotion logic:", err);
  }
};

const demoteCCMsAfter15Days = async () => {
  // console.log("🔁 Checking for CCMs eligible for demotion...");

  try {
    const trackers = await CCMDemotionTracker.findAll();

    for (const tracker of trackers) {
      const now = new Date();
      const triggeredAt = new Date(tracker.triggeredAt);
      const daysPassed = Math.floor(
        (now - triggeredAt) / (1000 * 60 * 60 * 24)
      );

      if (daysPassed >= 15) {
        const underDMs = await DM.findAll({ where: { ccmId: tracker.ccmId } });

        if (underDMs.length < 10) {
          const t = await sequelize.transaction();

          try {
            // Get CCM details
            const ccm = await CCM.findOne({ where: { id: tracker.ccmId } });

            if (!ccm) {
              await CCMDemotionTracker.destroy({
                where: { id: tracker.id },
                transaction: t,
              });
              await t.commit();
              continue;
            }

            // Create new DM entry
            const newDM = await DM.create(
              {
                name: ccm.name,
                email: ccm.email,
                contact: ccm.contact,
                password_hash: ccm.password_hash,
                address: ccm.address,
              },
              { transaction: t, hooks: false }
            );

            // Update DMs to link to new DM
            await DM.update(
              {
                parentDmId: newDM.id,
                ccmId: null,
              },
              {
                where: { ccmId: tracker.ccmId },
                transaction: t,
              }
            );

            // Delete CCM
            await CCM.destroy({ where: { id: tracker.ccmId }, transaction: t });

            // Remove tracker entry
            await CCMDemotionTracker.destroy({
              where: { id: tracker.id },
              transaction: t,
            });

            await t.commit();
            // console.log(`✅ CCM with id ${tracker.ccmId} demoted to DM`);
          } catch (error) {
            await t.rollback();
            console.error(
              `❌ Failed demotion for CCM id ${tracker.ccmId}:`,
              error
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("🔥 Error in CCM demotion checker:", err);
  }
};

const promoteAMsToDM = async () => {
  // console.log("🔁 Running AM to DM Promotion Check (Unified Logic)");

  try {
    const amList = await AM.findAll();

    for (const am of amList) {
      // Step 1: Get direct sub-AMs under this AM
      const directSubAMs = await AM.findAll({ where: { parentAmId: am.id } });

      if (directSubAMs.length >= 10) {
        const t = await sequelize.transaction();

        try {
          // Step 2: Traverse to highest AM in the chain (to get correct parentDMId)
          let current = am;
          let highestAM = am;
          while (current.parentAmId) {
            const parent = await AM.findByPk(current.parentAmId);
            if (!parent) break;
            highestAM = parent;
            current = parent;
          }

          const parentDMId = highestAM.dmId || null;

          // Step 3: Nullify parentAmId of direct sub-AMs
          await AM.update(
            { parentAmId: null },
            { where: { parentAmId: am.id }, transaction: t }
          );

          // Step 4: Create DM record from the promoted AM
          const newDM = await DM.create(
            {
              name: am.name,
              email: am.email,
              contact: am.contact,
              password_hash: am.password_hash,
              address: am.address,
              parentdmId: parentDMId,
              ccmId: null,
            },
            { transaction: t, hooks: false } // 👈 disables rehashing
          );

          // Step 5: Assign those sub-AMs to the new DM
          await AM.update(
            { dmId: newDM.id },
            {
              where: {
                parentAmId: null,
                id: directSubAMs.map((a) => a.id),
              },
              transaction: t,
            }
          );

          // Step 6: Delete promoted AM from AM table
          await AM.destroy({ where: { id: am.id }, transaction: t });

          await t.commit();
          // console.log(`✅ AM with id ${am.id} promoted to DM`);
        } catch (err) {
          await t.rollback();
          console.error(`❌ Transaction failed for AM id ${am.id}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("🔥 Error in promotion logic:", err);
  }
};

//Demotion of the ccm after 15 days if it is unable to make 10 DM's Under it...
// cron.schedule("* * * * *", demoteCCMsAfter15Days);

// // This cron runs every day at midnight
cron.schedule("0 0 * * *", promoteAMsToDM);

// 🔁 Schedule to run every day at midnight
cron.schedule("55 23 * * *", promoteDMsToCCM);

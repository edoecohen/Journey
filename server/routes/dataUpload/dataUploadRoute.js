var fs = require("fs");
var util = require('util');
var db = require('../../db_Schemas/config.js');
var multiparty = require('multiparty');
var Degree = require('../../db_Schemas/models/degree');
var Skill = require('../../db_Schemas/models/skill');
var FieldOfStudy = require('../../db_Schemas/models/fieldOfStudy');
var School = require('../../db_Schemas/models/school');
var Position = require('../../db_Schemas/models/position');
var Company = require('../../db_Schemas/models/company');
var Profile = require('../../db_Schemas/models/profile');
var Industry = require('../../db_Schemas/models/industry');
var EduMilestone = require('../../db_Schemas/models/eduMilestone');
var ExpMilestone = require('../../db_Schemas/models/expMilestone');
var Promise = require("bluebird");
var async = require("async");


module.exports = {
  parseUploadedData: function(req, res) {
    var data_dump_profiles = JSON.parse(fs.readFileSync(req.files.jsondata.path, "utf8"));

    async.eachSeries(data_dump_profiles, function(person, callbackNext) {

      obj = {};
      var skills_ids = [];

      var getSkills = function(getSkillsCallback) {
        async.eachSeries(person.skills, function(skillName, nextSkill) {

          Skill.forge({
            'skill_name': skillName
          })
          .fetch()
          .then(function(skill) {
            if (skill === null) {
              Skill.forge({
                'skill_name': skillName
              }).save()
              .then(function(skill) {
                return skills_ids.push(skill.attributes.id);
              });
            } else {
              return skills_ids.push(skill.attributes.id);
            }
          });
          nextSkill(); // Go to the next skill in the array
        });

        getSkillsCallback(false); // Done with the loop over the skills array
      };

      var getCurrentPositionID = function(getCurrentPositionIDCallback) {
        var positionLabel = person.current_title[0];

        Position.forge({
          'position_name': positionLabel
        })
        .fetch()
        .then(function(position) {
          if (position === null) {
            Position.forge({
              'position_name': positionLabel
            }).save()
            .then(function(position) {
              obj.positionID = position.attributes.id;
              getCurrentPositionIDCallback(false)
            });
          } else {
            obj.positionID = position.attributes.id;
            getCurrentPositionIDCallback(false)
          }
        });
      }

      var getIndustryID = function(getIndustryIDCallback) {
        var industryLabel = person.industry[0];
        Industry.forge({
          'industry_name': industryLabel
        })
        .fetch()
        .then(function(industry) {
          if (industry === null) {
            Industry.forge({
              'industry_name': industryLabel
            }).save()
            .then(function(industry) {
              obj.industryID = industry.attributes.id;
              getIndustryIDCallback(false)
            });
          } else {
            obj.industryID = industry.attributes.id;
            getIndustryIDCallback(false);
          }
        });
      };

      var getCompanyID = function(getCompanyIDCallback) {
        var companyLabel = person.current_company[0];

        Company.forge({
          'company_name': companyLabel
        })
        .fetch()
        .then(function(company) {
          if (company === null) {
            Company.forge({
              'company_name': companyLabel
            }).save()
            .then(function(company) {
              obj.companyID = company.attributes.id;
              getCompanyIDCallback(false)
            });
          } else {
            obj.companyID = company.attributes.id;
            getCompanyIDCallback(false)
          }
        });
      }

      var createProfile = function(createProfileCallback) {
        new Profile({
          profile_name: person.full_name[0],
          profileURL: person.url,
          picURL: person.current_photo_link,
          headline: person.headline[0],
          currentLocation: person.location[0],
          currentPosition_id: obj.positionID,
          industry_id: obj.industryID,
          currentCompany_id: obj.companyID
        }).save()
        .then(function(profile) {
          obj.profileID = profile.attributes.id;
          profile.skills().attach(skills_ids);
          createProfileCallback(false);
        }).catch(function(err) {
          console.error(err);
        });
      };

      var createEducationMilestones = function(outerCallback) {

        async.eachSeries(person.educationList, function(eduMilestone, nextMilestone) {

          var milestone = {
            profileID: obj.profileID,
            startYear: eduMilestone.start_date,
            endYear: eduMilestone.end_date
          };

          var getDegreeID = function(getDegreeIDCallback) {

            var degreeLabel = eduMilestone.degree;

            Degree.forge({
              'degree_name': degreeLabel
            })
            .fetch()
            .then(function(degree) {
              if (degree === null) {
                Degree.forge({
                  'degree_name': degreeLabel
                }).save()
                .then(function(degree) {
                  milestone.degreeID = degree.attributes.id;
                  getDegreeIDCallback(false)
                });
              } else {
                milestone.degreeID = degree.attributes.id;
                getDegreeIDCallback(false)
              }
            });
          };

          var getFosID = function(getFosIDCallback) {

            var fosLabel = eduMilestone.major;

            FieldOfStudy.forge({
              'fieldOfStudy_name': fosLabel
            })
            .fetch()
            .then(function(fos) {
              if (fos === null) {
                FieldOfStudy.forge({
                  'fieldOfStudy_name': fosLabel
                }).save()
                .then(function(fos) {
                  milestone.fosID = fos.attributes.id;
                  getFosIDCallback(false)
                });
              } else {
                milestone.fosID = fos.attributes.id;
                getFosIDCallback(false)
              }
            });
          };

          var getSchoolID = function(getSchoolIDCallback) {

            var schoolLabel = eduMilestone.school;

            School.forge({
              'school_name': schoolLabel
            })
            .fetch()
            .then(function(school) {
              if (school === null) {
                School.forge({
                  'school_name': schoolLabel
                }).save()
                .then(function(school) {
                  milestone.schoolID = school.attributes.id;
                  getSchoolIDCallback(false)
                });
              } else {
                milestone.schoolID = school.attributes.id;
                getSchoolIDCallback(false)
              }
            });
          };

          var newEduMilestone = function(newEduMilestoneCallback) {
            new EduMilestone({
              profile_id: milestone.profileID,
              degree_id: milestone.degreeID,
              fieldOfStudy_id: milestone.fosID,
              school_id: milestone.schoolID,
              startYear: milestone.startYear,
              endYear: milestone.endYear
            }).save()
            .then(function(eduMilestone) {
              console.log('New eduMilestone saved:', eduMilestone);
              newEduMilestoneCallback(false);
            }).catch(function(err) {
              console.error(err);
            });
          };

          var getDegreeIDAsync      =   Promise.promisify(getDegreeID),
              getFosIDAsync         =   Promise.promisify(getFosID),
              getSchoolIDAsync      =   Promise.promisify(getSchoolID),
              newEduMilestoneAsync  =   Promise.promisify(newEduMilestone);

          getDegreeIDAsync().then(function() {
            return getFosIDAsync();
          }).then(function() {
            return getSchoolIDAsync();
          }).then(function() {
            return newEduMilestoneAsync();
          }).then(function() {
            console.log('newEduMilestone about to be saved!!!', milestone);
            nextMilestone(); // Go to the next eduMilestone in the array
          });


        }, function done(){
          outerCallback(false); // Done with the loop over the education list array          
        });
      };

      var createExperienceMilestones = function(outerCallback) {

        async.eachSeries(person.past_experience_list, function(expMilestone, nextMilestone) {

          var milestone = {
            profileID: obj.profileID,
            start_date: expMilestone.start_date,
            end_date: expMilestone.end_date,
            duration: expMilestone.duration
          };

          var getPositionID = function(getPositionIDCallback) {

            var positionLabel = expMilestone.title;

            Position.forge({
              'position_name': positionLabel
            })
            .fetch()
            .then(function(position) {
              if (position === null) {
                Position.forge({
                  'position_name': positionLabel
                }).save()
                .then(function(position) {
                  milestone.positionID = position.attributes.id;
                  getPositionIDCallback(false)
                });
              } else {
                milestone.positionID = position.attributes.id;
                getPositionIDCallback(false)
              }
            });
          };

          var getCompanyID = function(getCompanyIDCallback) {

            var companyLabel = expMilestone.company;

            Company.forge({
              'company_name': companyLabel
            })
            .fetch()
            .then(function(company) {
              if (company === null) {
                Company.forge({
                  'company_name': companyLabel
                }).save()
                .then(function(company) {
                  milestone.companyID = company.attributes.id;
                  getCompanyIDCallback(false)
                });
              } else {
                milestone.companyID = company.attributes.id;
                getCompanyIDCallback(false)
              }
            });
          };

          var newExpMilestone = function(newExpMilestoneCallback) {
            new ExpMilestone({
              profile_id: milestone.profileID,
              position_id: milestone.positionID,
              company_id: milestone.companyID,
              start_date: milestone.start_date,
              end_date: milestone.end_date,
              duration: milestone.duration
            }).save()
            .then(function(expMilestone) {
              console.log('New expMilestone saved:', expMilestone);
              newExpMilestoneCallback(false);
            }).catch(function(err) {
              console.error(err);
            });
          };

          var getPositionIDAsync    =   Promise.promisify(getPositionID),
              getCompanyIDAsync     =   Promise.promisify(getCompanyID),
              newExpMilestoneAsync  =   Promise.promisify(newExpMilestone);

          getPositionIDAsync().then(function() {
            return getCompanyIDAsync();
          }).then(function() {
            return newExpMilestoneAsync();
          }).then(function(milestone) {
            console.log('newExpMilestone about to be saved!!!', milestone);
            nextMilestone(); // Go to the next expMilestone in the array
          });

        }, function done(){
          outerCallback(false); // Done with the loop over the experience list array          
        });
      };


      var getSkillsAsync                  =   Promise.promisify(getSkills),
          getIndustryIDAsync              =   Promise.promisify(getIndustryID),
          getCurrentPositionIDAsync       =   Promise.promisify(getCurrentPositionID),
          getCompanyIDAsync               =   Promise.promisify(getCompanyID),
          createProfileAsync              =   Promise.promisify(createProfile),
          createEducationMilestonesAsync  =   Promise.promisify(createEducationMilestones),
          createExperienceMilestonesAsync =   Promise.promisify(createExperienceMilestones);

      getSkillsAsync().then(function() {
        return getCompanyIDAsync();
      }).then(function() {
        return getIndustryIDAsync();
      }).then(function() {
        return getCurrentPositionIDAsync();
      }).then(function() {
        return createProfileAsync();
      }).then(function() {
        return createEducationMilestonesAsync();
      }).then(function() {
        return createExperienceMilestonesAsync();
      }).then(function() {
        console.log('at end of everything, obj looks like:', obj)
        callbackNext(); // Go to next person
      })
    });

  }
}

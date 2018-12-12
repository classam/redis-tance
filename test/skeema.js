const redis = require('redis');
const Tance = require('../lib/tance').Tance;
const Skeema = require('../lib/tance').Skeema;
const assert = require('chai').assert;
const uuid = require('uuid/v4');

let tance = null;

describe("Schema tests", function() {

    before(async function () {
        const redisClient = redis.createClient();
        tance = new Tance(redisClient);

        await tance.ready();
        await tance.flushall();
        return;
    });

    it("Valid schema", async function() {
        let employeeV1 = {
            "type": "object",
            "properties": {
                "firstname": {"type": "string"},
                "lastname": {"type": "string"},
            },
            "required": ["firstname", "lastname"]
        };

        let employeeSchema = new Skeema();

        employeeSchema.addVersion(employeeV1, x => x);

        let validEmployee = {
            "version": 1,
            "firstname": "Charles",
            "lastname": "Huckbreimer",
        };

        assert.isTrue(employeeSchema.isValid(validEmployee));
    });

    it("Invalid schema", async function() {
        let employeeV1 = {
            "type": "object",
            "properties": {
                "firstname": {"type": "string"},
                "lastname": {"type": "string"},
            },
            "required": ["firstname", "lastname"]
        };

        let employeeSchema = new Skeema();

        employeeSchema.addVersion(employeeV1, x => x);

        let invalidEmployee = {
            "version": 1,
            "firstname": "Charles",
        };

        assert.isFalse(employeeSchema.isValid(invalidEmployee));
    });

    it("Upgrading schema", async function() {
        let employeeV1 = {
            "type": "object",
            "properties": {
                "firstname": {"type": "string"},
                "lastname": {"type": "string"},
            },
            "required": ["firstname", "lastname"]
        };

        let employeeV2 = {
            "type": "object",
            "properties": {
                "firstname": {"type": "string"},
                "lastname": {"type": "string"},
                "salary": {"type": "integer"},
            },
            "required": ["firstname", "lastname"]
        };

        let employeeV3 = {
            "type": "object",
            "properties": {
                "firstname": {"type": "string"},
                "lastname": {"type": "string"},
                "salary": {"type": "integer"},
                "fullname": {"type": "string"},
            },
            "required": ["firstname", "lastname", "fullname"]
        }

        let employeeSchema = new Skeema();

        employeeSchema.addVersion(employeeV1, x => x);
        employeeSchema.addVersion(employeeV2, v1_employee => {
            let v2_employee = v1_employee;
            v2_employee.salary = 30000;
            return v2_employee;
        });
        employeeSchema.addVersion(employeeV3, v2_employee => {
            let v3_employee = v2_employee;
            v3_employee.fullname = `${v2_employee.firstname} ${v2_employee.lastname}`;
            return v3_employee;
        });

        let validEmployee = {
            "version": 1,
            "firstname": "Charles",
            "lastname": "Huckbreimer",
        };

        let upgradedEmployee = employeeSchema.upgrade(validEmployee);

        assert.equal(upgradedEmployee.version, 3);
        assert.equal(upgradedEmployee.fullname, "Charles Huckbreimer");
    });
});
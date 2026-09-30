import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDeletedAt1790668344287 implements MigrationInterface {
    name = 'AddUserDeletedAt1790668344287'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deletedAt"`);
    }

}

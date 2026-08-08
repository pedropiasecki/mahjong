import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
export default class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column()
    name: string;
    @Column()
    email: string;
    @Column()
    password: string
    @Column({ nullable: true})
    avatar: string;
    @CreateDateColumn()
    create_at: Date;
    @UpdateDateColumn()
    update_at: Date;
}
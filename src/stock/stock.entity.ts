import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['code'])
export class JiJinEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '基金代码', length: 100, type: 'varchar' })
  code: string;

  @Column({ comment: '基金名称', length: 100, type: 'varchar' })
  name: string;

  @Column({ comment: '基金类型', length: 100, type: 'varchar' })
  type: string;

  // N收益率
  @Column({ comment: '收益率', length: 100, type: 'varchar' })
  yield1N: string;

  // 1Y收益率
  @Column({ comment: 'Y收益率', length: 100, type: 'varchar' })
  yieldY: string;
}

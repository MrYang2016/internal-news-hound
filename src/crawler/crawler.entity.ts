import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

// 新闻来源
@Entity()
@Unique(['name'])
export class NewsSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '名称', length: 100 })
  name: string;

  // 官网
  @Column({ comment: '官网', length: 2000 })
  website: string;

  // OneToMany
  @OneToMany(() => News, (news) => news.source)
  news: News[];
}

@Entity()
@Index('Idx_source_name', ['source'])
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '标题', length: 2000 })
  title: string;

  @Column({ comment: '链接', length: 2000 })
  link: string;

  @Column({ comment: '摘要', length: 2000 })
  summary: string;

  @Column({ comment: '时间', type: 'timestamp' })
  time: Date;

  @Column({ comment: '高亮', length: 100, default: '' })
  highlight: string;

  // ManyToOne
  @ManyToOne(() => NewsSource, (source) => source.news, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceName', referencedColumnName: 'name' })
  source: NewsSource;
}

@Entity()
export class Visit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: 'IP', length: 100 })
  ip: string;

  @Column({ comment: '访问时间, 按天保存', type: 'timestamp' })
  time: Date;

  @Column({ comment: '次数', type: 'integer', default: 0 })
  count: number;
}

# AIエージェントでシステムを構築するガイド / A Non-Developer's Guide to Building Systems with AI Agents

開発経験がなくても、AIとの対話で業務システムを構築できる。このガイドでは「従業員の勤怠管理システム」を題材に、Claude Coworkを使った構築方法を段階的に解説する。

You can build business systems through conversation with AI, without development experience. This guide uses an employee time-tracking system as a working example, built with Claude Cowork.

> **Claude Coworkとは？** Claudeのデスクトップアプリに搭載された機能で、ファイル操作、ツール連携、タスク自動化を会話ベースで行える。Slack、Google Sheets、Notionなどの外部ツールとconnector（接続）を設定して使う。
>
> **What is Claude Cowork?** A feature in Claude's desktop app for file management, tool integration, and task automation through conversation. You connect external tools like Slack, Google Sheets, and Notion via connectors.

> **勤怠データは正確性が最重要。** このガイド全体を通して、AIの「幻覚」（もっともらしいが不正確な出力）を防ぐ方法を示す。原則：**計算はスプレッドシートの数式やデータベースに任せる。AIに数値を「推測」させない。結果は必ず自分の目で検証する。**
>
> **Work hour data demands high accuracy.** This guide shows how to prevent AI hallucination. The principle: **calculations happen in spreadsheet formulas or databases. Never let AI guess numbers. Always verify results yourself.**

---

## Phase 1: 仕様を考える / Figuring Out Your Spec

いきなりAIに「作って」と頼まない。まず自分で「何を作るか」を考える。AIはその思考を助けるパートナーとして使う。

Don't jump straight to "build this." First, think through what you're building. Use AI as a thinking partner.

### Step 1: 今の業務を書き出す / Map Your Current Workflow

AIに相談する前に、まず自分で現在の業務フローを書き出す。以下の問いに答えてみよう。

Before talking to AI, write down your current workflow yourself. Answer these questions:

**自分に聞く質問 / Questions to ask yourself:**

- 従業員は今、勤怠をどうやって記録しているか？ / How do employees currently record their hours?
- そのデータはどこに保存されているか？ / Where is that data stored?
- 月末に誰が何をしているか？ / What happens at month-end, and who does it?
- 今の方法で一番面倒なのはどこか？ / What's the most painful part?
- 二重入力や手作業はどこにあるか？ / Where does double-entry or manual work happen?

<details>
<summary>ヒント：書き出しの例 / Hint: Example write-up</summary>

```
現在のフロー：
1. 従業員がSlackワークフローで打刻（開始時刻＋タスクを入力）
2. 退勤時に別のSlackワークフローを送信
3. Google Sheetにも時間を記入（予定時間も設定できる）
4. 月末にマネージャーがSheetを確認・集計し、HRツールに転記

問題点：
- SlackとSheetの二重入力
- 月末の集計が手作業で間違いやすい
- マネージャーがリアルタイムで状況を把握できない

Current flow:
1. Employees check in via Slack workflow (start time + tasks)
2. Send another Slack workflow to check out
3. Also update a Google Sheet with hours and expected hours
4. Managers consolidate at month-end and enter into HR tool

Problems:
- Double data entry (Slack + Sheet)
- Monthly consolidation is manual and error-prone
- No real-time visibility for managers
```

</details>

### Step 2: AIに質問してもらう / Let AI Interview You

書き出した内容をAIに渡して、**自分では気づかなかった論点**を引き出してもらう。AIに仕様を書かせるのではなく、AIに質問させる。

Hand your write-up to AI and ask it to **surface questions you haven't thought of**. Don't ask AI to write the spec — ask AI to interview you.

**AIへのプロンプト / Prompt for AI:**

```
これは今の勤怠管理フローです。[上で書いた内容を貼る]

このフローを改善するシステムを作りたい。
仕様を決めるために、私に質問してください。
以下の観点を網羅してほしい：
- 利用者の種類と権限
- 記録すべきデータ項目
- 業務ルール（残業計算、丸め処理など）
- エッジケース（打刻忘れ、深夜勤務など）
- 既存ツールとの連携

一度に5つまでの質問にしてください。
```

<details>
<summary>ヒント：AIが聞いてくるはずの質問例 / Hint: Questions AI should ask</summary>

AIから出てくるべき質問の例。もし出てこなければ、自分から考えてみよう：

- 従業員は何人か？ / How many employees?
- タイムゾーンは？複数拠点か？ / What time zones? Multiple offices?
- 固定シフトかフレックスか？ / Fixed shifts or flexible?
- 退勤打刻を忘れたらどうする？ / What if someone forgets to check out?
- 誰がシフト変更を承認するか？ / Who approves schedule changes?
- HRツールが求めるデータ形式は？ / What format does the HR tool expect?
- 残業の定義と計算方法は？ / How is overtime defined and calculated?

</details>

**重要：すべての質問に丁寧に答える。** ここで省略すると、後で問題になる。

**Important: Answer every question thoroughly.** Shortcuts here become problems later.

### Step 3: 仕様書を自分の言葉でまとめる / Write the Spec in Your Own Words

Q&Aが終わったら、**AIではなく自分で**仕様をまとめてみる。完璧でなくていい。その後AIにレビューしてもらう。

After the Q&A, try writing the spec **yourself**. It doesn't need to be perfect. Then ask AI to review it.

**自分に聞く質問 / Questions to ask yourself:**

- このシステムを使う人は誰か？それぞれ何ができるべきか？ / Who uses this? What can each role do?
- 絶対に必要な機能はどれか？あると嬉しい機能は？ / Must-have vs. nice-to-have features?
- データの正確性をどう保証するか？ / How do we ensure data accuracy?
- 既存のSlackやSheetの流れをどう変えるか？ / How does this change existing workflows?

**AIへのプロンプト（レビュー依頼） / Prompt for AI (review request):**

```
これが私がまとめた仕様書です。[自分の仕様を貼る]

以下の観点でレビューしてください：
- 抜け漏れている要件はないか
- 矛盾している箇所はないか
- 曖昧で判断できない箇所はないか
- エッジケースの考慮漏れはないか

改善案ではなく、問題点だけ指摘してください。修正は自分で判断します。
```

<details>
<summary>ヒント：仕様書に含めるべき項目 / Hint: What a spec should cover</summary>

- ユーザーの種類と権限（従業員、マネージャー、管理者） / User roles and permissions
- 機能一覧と受け入れ条件 / Feature list with acceptance criteria
- データモデル（何を保存するか） / Data model
- 業務ルール（残業、丸め、承認フロー） / Business rules
- エッジケースの処理方法 / Edge case handling
- 他システムとの連携方法 / Integration points

</details>

### Step 4: 関係者にフィードバックをもらう / Get Stakeholder Feedback

仕様書をマネージャーと従業員数人に見せて、フィードバックをもらう。その結果をAIとの次の会話に持ち込む。

Show the spec to managers and employees. Bring feedback into your next AI conversation.

**AIへのプロンプト / Prompt for AI:**

```
仕様書にフィードバックをもらいました：
- [フィードバック1]
- [フィードバック2]

それぞれについて、仕様のどこをどう変えるべきか教えてください。
影響範囲も示してください（他の機能に波及するか）。
```

**幻覚防止チェック / Hallucination check:**

- [ ] 業務ルールはすべてチームから来たもので、AIの推測ではないか？ / All business rules from your team, not AI?
- [ ] タイムゾーンの扱いが明示的に定義されているか？ / Timezone handling explicitly defined?
- [ ] 残業・丸めルールは自社ポリシーと一致しているか？ / Overtime rules match your policy?
- [ ] 頼んでいない機能が紛れ込んでいないか？ / Any features you didn't ask for?

---

## Phase 2: 設計を組み立てる / Planning Architecture

仕様が固まったら、どのツールでどう作るかを考える。開発者向けのツールは不要で、既に使い慣れたツールの組み合わせで十分。

With a solid spec, decide which tools to use. You don't need developer tools — familiar tools combined smartly are enough.

### Step 5: 使うツールを選ぶ / Choose Your Tools

**自分に聞く質問 / Questions to ask yourself:**

- チームが既に使い慣れているツールは何か？ / What tools does your team already use?
- 予算はいくらか？無料ツールで足りるか？ / What's your budget? Will free tools suffice?
- Slackの打刻フローは残したいか、変えたいか？ / Keep or change the Slack check-in flow?
- データは社内に置く必要があるか？ / Must data stay on-premise?

**AIへのプロンプト / Prompt for AI:**

```
この仕様書のシステムを作りたい。[仕様を貼る]
私は開発者ではなく、AIの助けを借りて構築・運用する。

アーキテクチャの選択肢を2〜3案出してください。
それぞれ以下を比較してほしい：
- 非開発者が運用する難易度
- コスト（従業員[X]人規模）
- 勤怠データの正確性の担保しやすさ
- 将来の機能追加のしやすさ
```

<details>
<summary>ヒント：非開発者向けツールの組み合わせ例 / Hint: Tool combinations for non-developers</summary>

**パターンA：Google Sheets中心**（現在のワークフローに最も近い）

| 用途 / Need | ツール / Tool | 理由 / Why |
|---|---|---|
| データ保存 / Storage | Google Sheets | チームが使い慣れている。数式で計算可能 |
| 打刻入力 / Check-in | Slack Workflow + Google Forms | 既存のSlack体験を維持 |
| ダッシュボード / Dashboard | Sheetsの別シート or Looker Studio | 追加ツール不要 |
| 月次集計 / Monthly summary | Sheetsの数式 + Claude Cowork | 自動計算＋AIで検証 |
| 自動化 / Automation | Claude Cowork + connectors | Slack/Sheets連携を自動化 |

**パターンB：Notion Database中心**（より構造化されたデータ管理）

| 用途 / Need | ツール / Tool | 理由 / Why |
|---|---|---|
| データ保存 / Storage | Notion Database | リレーション、フィルター、ビューが強力 |
| 打刻入力 / Check-in | Slack → Notion連携 | Slackから直接DBに記録 |
| ダッシュボード / Dashboard | Notionのビュー機能 | フィルター、カレンダー、テーブルを組み合わせ |
| 月次集計 / Monthly summary | Notionの数式 + Claude Cowork | 計算プロパティ＋AIで検証 |
| 自動化 / Automation | Claude Cowork + connectors | Slack/Notion連携を自動化 |

</details>

> **Claude Coworkの役割：** Coworkはこれらのツールを**つなぐ**ハブとして機能する。Slack connector、Google Sheets connector、Notion connectorを設定すれば、「Slackの打刻をSheetsに記録して」「月末の集計を作って」といった指示を会話ベースで実行できる。
>
> **Claude Cowork's role:** Cowork acts as the **hub** connecting these tools. With connectors set up, you can give instructions like "log this Slack check-in to the Sheet" or "generate the monthly summary" through conversation.

### Step 6: データの構造を決める / Design Your Data Structure

正確性が最も重要な部分。まず自分で「何を記録する必要があるか」をリストアップしてから、AIに構造化してもらう。

This is where accuracy matters most. List what you need to track, then ask AI to structure it.

**自分に聞く質問 / Questions to ask yourself:**

- 従業員について何を記録するか？（名前、部署、契約時間...） / What do you track per employee?
- 1回の打刻で何を保存するか？ / What data per time entry?
- 「誰が何をいつ変更したか」を追跡する必要があるか？ / Need an audit trail?
- 将来のシフト計画にはどんなデータが必要か？ / What does shift planning need?

<details>
<summary>ヒント：Google Sheetsの場合のシート構成例 / Hint: Google Sheets structure</summary>

**シート1：従業員マスター**

| 列 | 内容 |
|---|---|
| employee_id | 一意のID |
| name | 氏名 |
| department | 部署 |
| expected_hours | 月間予定時間 |

**シート2：勤怠記録**

| 列 | 内容 |
|---|---|
| entry_id | 一意のID |
| employee_id | 従業員ID |
| date | 日付 |
| check_in | 出勤時刻 |
| check_out | 退勤時刻（空白=未退勤） |
| hours_worked | =数式で自動計算 |
| tasks | 作業内容メモ |
| status | open / closed / flagged |

**シート3：月次サマリー**

| 列 | 内容 |
|---|---|
| employee_id | 従業員ID |
| month | 対象月 |
| total_days | =COUNTIF数式 |
| total_hours | =SUMIF数式 |
| expected_hours | =VLOOKUP数式 |
| difference | =total - expected |

**重要：** `hours_worked`は必ずスプレッドシートの数式（例：`=(D2-C2)*24`）で計算する。AIに計算させない。

</details>

<details>
<summary>ヒント：Notion Databaseの場合の構成例 / Hint: Notion Database structure</summary>

**DB1：従業員**
プロパティ: Name (title), Department (select), Expected Hours (number)

**DB2：勤怠記録**
プロパティ: Employee (relation → DB1), Date (date), Check In (date with time), Check Out (date with time), Hours Worked (formula), Tasks (text), Status (select: open/closed/flagged)

**DB3：月次サマリー**
プロパティ: Employee (relation → DB1), Month (select), Total Hours (rollup from DB2), Expected Hours (rollup from DB1), Difference (formula)

**重要：** Hours WorkedはNotionのformulaプロパティで計算する。AIに計算させない。

</details>

### Step 7: データフローを整理する / Map the Data Flows

各シナリオでデータがどう流れるかを明確にする。ここが曖昧だと、あとで必ず問題になる。

Clarify how data flows in each scenario. Ambiguity here becomes bugs later.

**考えるべきシナリオ / Scenarios to think through:**

- 従業員がSlackで出勤 → データはどこに記録される？ / Slack check-in → where is data logged?
- 退勤 → 勤怠レコードはどう完成する？ / Check-out → how is the entry completed?
- マネージャーがダッシュボードを見る → 何が表示される？ / Manager views dashboard → what's shown?
- 月末 → サマリーはどう生成される？ / Month-end → how is the summary generated?
- 退勤忘れ → どう検知・対処する？ / Forgot check-out → how is it detected?

> **Coworkでの実現イメージ：** Slackで打刻 → Slack connectorが検知 → Coworkが Google Sheet/Notionに自動記録。マネージャーは「今日の出勤状況を教えて」とCoworkに聞くだけでサマリーを取得できる。

**幻覚防止チェック / Hallucination check:**

- [ ] 時間計算はスプレッドシート数式/DB関数で行っているか？ / Time calcs use formulas, not AI?
- [ ] 集計はデータから計算され、手入力やAI生成ではないか？ / Aggregations computed from data?
- [ ] 変更の記録（誰がいつ修正したか）が残るか？ / Change history tracked?
- [ ] 退勤忘れの検知フローが定義されているか？ / Missing check-out detection defined?

---

## Phase 3: プロトタイプを作る / Building the Prototype

ここからClaude Coworkと一緒に実際に構築する。鉄則は**「小さく作って、すぐ検証して、段階的に拡張する」**。

Now build with Claude Cowork. The rule: **build small, test immediately, expand gradually.**

### Step 8: Coworkのconnectorを設定する / Set Up Cowork Connectors

まず、必要なツールとの接続を設定する。Claude Coworkで以下のconnectorを追加する。

First, set up connections to your tools. Add these connectors in Claude Cowork.

**設定するconnector / Connectors to set up:**

- **Slack** — 打刻メッセージの読み取り / Read check-in messages
- **Google Sheets** or **Google Drive** — 勤怠データの読み書き / Read and write time data
- **Notion**（Notion DBを使う場合） — データベースの操作 / Database operations

Coworkに「Slackのconnectorを設定したい」と伝えれば、手順を案内してくれる。

Tell Cowork "I want to set up the Slack connector" and it will guide you through the setup.

### Step 9: データの入れ物を作る / Create the Data Structure

Google SheetまたはNotion Databaseに、Step 6で考えた構造を実際に作る。Coworkに依頼できる。

Create the structure from Step 6 in your Sheet or Notion DB. You can ask Cowork to help.

**Coworkへのプロンプト例 / Example prompt for Cowork:**

```
Google Sheetsに勤怠管理用のスプレッドシートを作りたい。
以下のシートが必要です：

1. 従業員マスター：[自分で決めた列を記載]
2. 勤怠記録：[自分で決めた列を記載]
3. 月次サマリー：[自分で決めた列を記載]

勤務時間の計算は必ずスプレッドシートの数式で行ってください。
AIが計算した数値を直接入力しないでください。
```

> **重要：「数式で計算する」を必ず指示に含める。** AIは数値を直接入力しがち。数式にしておけば、元データが変わっても自動で再計算される。
>
> **Critical: Always include "use formulas" in your instructions.** AI tends to hard-code values. Formulas auto-recalculate when source data changes.

### Step 10: テストデータで検証する / Test with Sample Data

テスト従業員のデータを入れて、計算が正しいか手動で確認する。

Enter test employee data and manually verify calculations.

**Coworkへのプロンプト例 / Example prompt for Cowork:**

```
テストデータを入れて検証したい。以下のデータを登録して：
- 従業員A：9:00出勤、17:30退勤 → 8.5時間のはず
- 従業員B：8:00出勤、退勤なし → 「未退勤」とフラグされるべき
- 従業員C：9:00-13:00、14:00-18:00 → 合計8時間のはず

登録したら、勤怠記録シートの内容を見せて。
計算された時間数が正しいか、一緒に確認したい。
```

> **結果を自分の目で確認する。** 従業員Aが8.5時間以外の数値を示していたら、期待値と実際値をCoworkに伝えて修正させる。「動いてるっぽい」で済ませない。
>
> **Check results with your own eyes.** If Employee A shows anything other than 8.5 hours, tell Cowork the expected vs. actual value. Never settle for "seems to work."

### Step 11: Slack連携を作る / Build the Slack Integration

Slackでの打刻がデータに自動反映される仕組みを作る。Coworkのscheduled taskやSlack connectorを使う。

Make Slack check-ins auto-populate your data. Use Cowork's scheduled tasks and Slack connector.

<details>
<summary>ヒント：Slack連携の構築アプローチ / Hint: Approaches for Slack integration</summary>

いくつかのアプローチがある。自分の技術レベルに合ったものを選ぶ：

- **方法1（最もシンプル）：** Slack Workflowは現状のまま残す。Coworkに「Slackの#check-inチャンネルの新しいメッセージを読んで、Google Sheetに記録して」と定期的に依頼する。
  - **Method 1 (simplest):** Keep existing Slack Workflow. Periodically ask Cowork to read new messages from #check-in and log to Sheet.
- **方法2（半自動）：** Coworkのscheduled taskを設定して、定期的にSlackの打刻を読み取り、Sheetに書き込む。
  - **Method 2 (semi-auto):** Set up a Cowork scheduled task to periodically read Slack and write to Sheet.
- **方法3（自動化ツール併用）：** ZapierやMakeでSlack → Google Sheetsの連携を作り、CoworkはダッシュボードとサマリーにHMする。
  - **Method 3 (with automation tools):** Use Zapier/Make for Slack → Sheets, Cowork handles dashboard and summaries.

</details>

### Step 12: 月次サマリーを作る / Build the Monthly Summary

正確性の要求が最も高い部分。自分で期待値を計算してから、結果と照合する。

Highest accuracy requirement. Calculate expected results yourself, then compare.

**考えるべきこと / Think about:**

- 深夜勤務（日付をまたぐシフト）の扱い / Shifts crossing midnight
- 休憩時間の控除 / Break deductions
- 丸め処理（小数点以下何桁？） / Rounding rules
- 怪しいデータの検出（16時間超、5分未満など） / Suspicious data flags

<details>
<summary>ヒント：月次サマリーのプロンプト例 / Hint: Monthly summary prompt</summary>

```
先月の勤怠サマリーを作ってください。表示項目：
- 従業員名
- 出勤日数
- 合計勤務時間
- 予定時間（従業員マスターから）
- 差分（超過/不足）
- 不完全な記録の数（退勤忘れ）

注意：
- 合計時間はスプレッドシートの数式から取得してください
- AI側で時間の足し算をしないでください
- 結果を出したら、私が手計算で2-3人分検証します
```

</details>

### Step 13: マネージャー向けの確認方法を作る / Create Manager Views

マネージャーが状況を確認する方法を整備する。専用ダッシュボードを作る必要はない場合もある。

Set up how managers check status. You may not need a dedicated dashboard.

<details>
<summary>ヒント：マネージャー向けの確認方法 / Hint: Manager view options</summary>

- **Google Sheets：** 専用の「ダッシュボード」シートを作り、QUERY関数やフィルターで今日の状況を表示
  - Create a "Dashboard" sheet with QUERY functions showing today's status
- **Notion：** フィルター付きのビュー（今日の出勤者、今週のサマリーなど）を作成
  - Create filtered views (today's workers, this week's summary)
- **Cowork：** マネージャーがCoworkに「今日の出勤状況を教えて」と聞くだけで、Sheets/Notionのデータを読んでサマリーを返す
  - Managers ask Cowork "show me today's attendance" and it reads from Sheets/Notion

</details>

### 構築の基本サイクル / The Build Cycle

すべての構築作業でこのサイクルを繰り返す：

1. **Coworkに作業を依頼する** / Ask Cowork to build something
2. **結果を自分の目で確認する** / Check results with your own eyes
3. **計算結果を手計算で検証する**（最低2-3件） / Verify calculations manually (at least 2-3 entries)
4. **問題があれば具体的に伝える**（「8.5時間のはずが9時間と表示されている」） / Report issues specifically
5. **修正を確認してから次に進む** / Confirm fix before moving on

---

## Phase 4: 本番に備える / Hardening for Launch

### Step 14: 問題になりそうなケースを洗い出す / Identify Failure Points

**Coworkに聞く / Ask Cowork:**

```
この勤怠システムで問題になりそうなケースを洗い出してください：
- 打刻忘れ
- 二重打刻
- 日付をまたぐ勤務
- 間違ったデータの修正
- シートやDBへのアクセス権限

それぞれの対処方法も提案してください。
```

### Step 15: アクセス権限を設定する / Set Up Access Controls

誰が何を見られるか、何を変更できるかを制限する。Google SheetsならシートごとのHMを、Notionならページ/DB単位のHMを設定する。

Restrict who can see and edit what. Use per-sheet protection in Google Sheets, or page/DB-level permissions in Notion.

### Step 16: テスト運用する / Run a Pilot Test

**Coworkに依頼 / Ask Cowork:**

```
従業員3人とマネージャー1人で1週間テスト運用したい。
テスト計画を作ってください：
- 毎日やること
- 確認すべきポイント
- 問題報告の方法
- 既知の制限事項
```

### Step 17: 移行計画を立てる / Plan the Migration

**考えるべきこと / Think about:**

- 旧システムと並行運用する期間は？ / How long to run old and new in parallel?
- 既存Google Sheetのデータ移行は？ / How to import existing Sheet data?
- 問題が起きたときのロールバックは？ / Rollback plan?
- 従業員に必要なトレーニングは？ / Training needed?

---

## 幻覚防止チェックリスト / Anti-Hallucination Checklist

構築プロセス全体を通して繰り返し確認する。

Use throughout the entire build process.

### データの正確性 / Data Accuracy

- [ ] 時間計算はスプレッドシート数式/DB関数で行っているか？ / Time calcs use formulas?
- [ ] 月次合計は個別記録から数式で計算されているか？ / Monthly totals from formulas, not AI?
- [ ] 元のタイムスタンプを保存しているか（事前計算値ではなく）？ / Raw timestamps stored?
- [ ] 丸め処理は表示時のみ？ / Rounding at display only?

### テスト / Testing

- [ ] すべての計算を既知のテストデータで検証したか？ / Verified with known test data?
- [ ] エッジケースをテストしたか（深夜、日付変更線）？ / Edge cases tested?
- [ ] 退勤忘れがフラグされ、無視されていないか？ / Missing check-outs flagged?

### AIとのやり取り / AI Interaction

- [ ] 実際のデータをAIに見せているか（「推測して」と言っていないか）？ / Showing real data to AI?
- [ ] AIが出した数値を手計算で検証しているか？ / Hand-checking AI's numbers?
- [ ] 数値の直接入力ではなく数式を使わせているか？ / Using formulas, not hard-coded values?
- [ ] 変更の履歴を残しているか？ / Keeping change history?

---

## 会話テンプレート / Conversation Templates

### 新しいセッションを始めるとき / Starting a New Session

```
勤怠管理システムを構築しています。現在の状態：
- データ保存先：Google Sheet / Notion（どちらか記載）
- 完成した部分：[リスト]
- 作業中：[現在のタスク]
- 既知の問題：[リスト]

今日やりたいこと：[具体的なタスク]
```

### データが間違っているとき / When Data is Wrong

```
勤怠記録シートの従業員Aのデータがおかしい：

期待した結果：8.5時間（9:00-17:30）
実際の表示：9時間

使われている数式：[数式を貼る]
該当セルの値：[値を貼る]

原因を調べて修正してください。
```

### AIの提案を理解したいとき / Understanding AI's Suggestion

```
この数式/設定を提案してくれましたが：[内容を貼る]

説明してください：
- なぜこの方法にしたのか？
- [特定のケース]では何が起きるか？
- もっとシンプルな方法はあるか？
```

---

## まとめ / Summary

まず自分で考え、AIを壁打ち相手にして仕様を固める（Phase 1-2）。次にClaude Coworkを使い、一度に1つずつ小さく作り、実データで毎回検証する（Phase 3）。最後に実際のユーザーでテストし、慎重に移行する（Phase 4）。

Think first, use AI to refine the spec (Phase 1-2). Build one piece at a time with Cowork, verifying with real data every time (Phase 3). Test with real users and migrate carefully (Phase 4).

最も大切な習慣：**AIが出した数値を信用しない。計算は数式に任せ、結果は自分で検証する。**

The most important habit: **never trust AI-generated numbers. Let formulas calculate, and verify results yourself.**

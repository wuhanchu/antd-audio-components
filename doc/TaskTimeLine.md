## Classes

<dl>
<dt><a href="#TalkTimeLine">TalkTimeLine</a></dt>
<dd><p>default export, if have not event just use InputMentions</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#RECORD_TYPE">RECORD_TYPE</a></dt>
<dd><p>对话类型</p>
</dd>
</dl>

<a name="TalkTimeLine"></a>

## TalkTimeLine

default export, if have not event just use InputMentions

**Kind**: global class

-   [TalkTimeLine](#TalkTimeLine)
    -   [new TalkTimeLine(dialogue, hotWordList, labels, playId, running, pause, showUserSelect, reverse, onItemChange, onUserChange, onLabelChange, onPlayChange)](#new_TalkTimeLine_new)
    -   [.mention](#TalkTimeLine+mention)
    -   [.keyBindMethods](#TalkTimeLine+keyBindMethods)
    -   [.state](#TalkTimeLine+state)
    -   [.dialogueMap](#TalkTimeLine+dialogueMap)
    -   [.bindKey](#TalkTimeLine+bindKey)
    -   [.renderTag](#TalkTimeLine+renderTag) ⇒ <code>\*</code>
    -   [.scrollToItem](#TalkTimeLine+scrollToItem)
    -   [.renderMentions](#TalkTimeLine+renderMentions) ⇒ <code>\*</code>
    -   [.setChangeId(changeId, callback)](#TalkTimeLine+setChangeId)
    -   [.renderInfo(item)](#TalkTimeLine+renderInfo)
    -   [.renderInput(item)](#TalkTimeLine+renderInput)

<a name="new_TalkTimeLine_new"></a>

### new TalkTimeLine(dialogue, hotWordList, labels, playId, running, pause, showUserSelect, reverse, onItemChange, onUserChange, onLabelChange, onPlayChange)

| Param          | Type                  | Description      |
| -------------- | --------------------- | ---------------- |
| dialogue       | <code>Array</code>    | 对话数据         |
| hotWordList    | <code>Array</code>    | 热词             |
| labels         | <code>Array</code>    | 标签             |
| playId         | <code>Integer</code>  | 当前播放的 id    |
| running        | <code>Boolean</code>  | 开启录音标志     |
| pause          | <code>Boolean</code>  | 播放暂停标志     |
| showUserSelect | <code>Boolean</code>  | 是否开启用户选择 |
| reverse        | <code>Boolean</code>  | 是否反转显示数据 |
| onItemChange   | <code>function</code> | 对话修改         |
| onUserChange   | <code>function</code> | 对话修改         |
| onLabelChange  | <code>function</code> | 标志修改         |
| onPlayChange   | <code>function</code> | playid 修改      |

<a name="TalkTimeLine+mention"></a>

### talkTimeLine.mention

react object of mention

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)  
**Properties**

| Type                |
| ------------------- |
| <code>object</code> |

<a name="TalkTimeLine+keyBindMethods"></a>

### talkTimeLine.keyBindMethods

按键绑定

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)  
**Properties**

| Type               |
| ------------------ |
| <code>Array</code> |

<a name="TalkTimeLine+state"></a>

### talkTimeLine.state

state

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)  
**Properties**

| Type                |
| ------------------- |
| <code>object</code> |

<a name="TalkTimeLine+dialogueMap"></a>

### talkTimeLine.dialogueMap

对话 map

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)  
**Properties**

| Type                |
| ------------------- |
| <code>object</code> |

<a name="TalkTimeLine+bindKey"></a>

### talkTimeLine.bindKey

绑定按键

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)  
<a name="TalkTimeLine+renderTag"></a>

### talkTimeLine.renderTag ⇒ <code>\*</code>

渲染错误标签

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)

| Param |
| ----- |
| item  |
| index |

<a name="TalkTimeLine+scrollToItem"></a>

### talkTimeLine.scrollToItem

滚动到对应的位置

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)

| Param |
| ----- |
| item  |

<a name="TalkTimeLine+renderMentions"></a>

### talkTimeLine.renderMentions ⇒ <code>\*</code>

渲染建议

**Kind**: instance property of [<code>TalkTimeLine</code>](#TalkTimeLine)

| Param |
| ----- |
| item  |
| index |

<a name="TalkTimeLine+setChangeId"></a>

### talkTimeLine.setChangeId(changeId, callback)

修改 changeId

**Kind**: instance method of [<code>TalkTimeLine</code>](#TalkTimeLine)

| Param    | Type            | Description   |
| -------- | --------------- | ------------- |
| changeId | <code>\*</code> | 修改的项目 ID |
| callback | <code>\*</code> | 回调函数      |

<a name="TalkTimeLine+renderInfo"></a>

### talkTimeLine.renderInfo(item)

渲染头部信息

**Kind**: instance method of [<code>TalkTimeLine</code>](#TalkTimeLine)

| Param | Type            |
| ----- | --------------- |
| item  | <code>\*</code> |

<a name="TalkTimeLine+renderInput"></a>

### talkTimeLine.renderInput(item)

渲染输入框

**Kind**: instance method of [<code>TalkTimeLine</code>](#TalkTimeLine)

| Param | Type           |
| ----- | -------------- |
| item  | <code>x</code> |

<a name="RECORD_TYPE"></a>

## RECORD_TYPE

对话类型

**Kind**: global constant

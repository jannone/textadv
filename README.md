# textadv

Text Adventures generator from Markdown files.

> Note: this is prototype app without any unit tests.
> Use it at your own risk!

```
Usage:
  $ textadv <file>

Commands:
  <file>  Input file to generate a Text Adventure from

For more info, run any command with the `--help` flag:
  $ textadv --help

Options:
  --lang <lang>    Target language (default: basic)
  --output <file>  Output file path
  -h, --help       Display this message
```

## File Format

Declare your project's name and intro at the root level:

```
# My Adventure

This is the intro to this awesome adventure!

Let's dive in!
```

Declare each location as a second-level text:
```
## Uncle's house

You are at your uncle's house.

The dog is restless and you hear a sound coming from the kitchen.

## Uncle's Kitchen [kitchen]

There is no one here...

The trash can is moving!
```

Add possible interactions as bullet-point lists:

```
- go kitchen
  - "You hold your breath for a moment and decide do check the kitchen"
  - goto kitchen
- stand still
  - "You decide it's better to stay quiet and watch your surroundings"
```

Second-level bullet-points can be of 3 types: messages, commands, or checks.

A message is just a quoted text:
```
"You hold your breath for a moment and decide do check the kitchen"
```

A command can change the state of the game.

Command's reference list:

- goto \<room>: Move player to the room with the specified ID
- set \<flag>: Set the named flag as 1 
- clear \<flag>: Clear the named flag back to 0 
- continue: Continue processing the next bullet
- check-room: Re-introduce the room to the player

A check will test the condition and skip to the next bullet when the condition is false.

Check's reference list:

- zero \<flag>: Check if the flag equals 0
- notzero \<flag>: Check if the flag is different from 0 

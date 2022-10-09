# textadv

Text Adventures generator from Markdown files.

> Note: this is prototype app without proper unit tests.
> Use it at your own risk!

```
Usage:
  $ textadv <command> [options]

Commands:
  gen <file>  Generates Text Adventure from a Markdown file
  run <file>  Runs Text Adventure from a Markdown file

For more info, run any command with the `--help` flag:
  $ textadv gen --help
  $ textadv run --help

Options:
  -h, --help  Display this message 
```

## File Format

### Project declaration

Declare your project's name and intro at the root level:

```
# Haunted House

This is the intro to this awesome adventure!

Let's dive in!
```

You can optionally start your file with a meta-information block:
```
---
title: Haunted House
author: John Doe <john.doe@example.com>
---
```

### Locations

Declare each location as a second-level text:
```
## Uncle's house

You are at your uncle's house.

The dog is restless and you hear a sound coming from the kitchen.
```

Sometimes you'll prefer to use a short identifier for your location (when using the `goto` command, for instance). This can be done via the `[...]` marker as seen below:

```
## Uncle's Kitchen [kitchen]

There is no one here...

The trash can is moving!
```

### Interactions

After declaring a location's description, add possible interactions as bullet-point lists:

```
- go kitchen
  - "You hold your breath for a moment and decide do check the kitchen"
  - goto kitchen
- stand still
  - "You decide it's better to stay quiet and watch your surroundings"
```

Each bullet point is matched against the players input. When a match is found, it will start executing the second-level bullet-points, and stop when those are finished (unless explicitly instructed otherwise by [Commands](#commands) and [Checks](#checks))

You can have one single bullet-point match against lots of input variations.
Example:
```
- check/examine dog/beagle/buddy
  - "Buddy is moving around the room in a very unusual way"
- hear/check sound(s)/noise; pay attention 
  - "This is nothing like you've heard before"
```

Second-level bullet-points can be of 3 types: [messages](#messages), [commands](#commands), or [checks](#checks).

#### Messages

A message is just a quoted text:
```
"You hold your breath for a moment and decide do check the kitchen"
```

#### Commands

A command can change the state of the game.

Command's reference list:

- goto \<room>: Move player to the room with the specified ID
- set \<flag>: Set the named flag as 1 
- clear \<flag>: Clear the named flag back to 0 
- continue: Continue processing the next bullet
- check-room: Re-introduce the room to the player

#### Checks

A check will test the condition and skip to the next bullet when the condition is false.

Check's reference list:

- zero \<flag>: Check if the flag equals 0
- notzero \<flag>: Check if the flag is different from 0 

## Using multiple files

You can split your adventure into multiple markdown files by using the `extends` keyword.

```
[extends](./another-file.md)
```

This will instantly load the referenced file (in parenthesis) and add its contents to each declared section.

This means you can have multiple files adding descriptions and commands to the same previously declared sections, in effect "extending" them.

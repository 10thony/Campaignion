-------
Foundations of the app

This application allows Dungeon Masters (DMs) and user players (ups) to do the following


Users can register, and be both DMs and ups simultaneously. 
a DM is a person who has created a campaign, they are the DM for that specific campaign.
Users are ups when they create a character and join a campaign that is not theirs. 

DMs can:
    Perform CRUD functionality on Campaigns and their subsequent children objects:
        Monsters, 
        Player Characters (pcs), 
        NonPlayerCharacters (npcs), 
        Items, 
        Quests, 
        Interactions,
        Actions,
        TimeLine Events,
        Locations,
        Maps,
    View Requests to join a campaign,
    Accept or reject requests to join a campaign, 
    DMs can make pcs for other ups to use in the campaign created by the DM, but the created by reference in the pcs needs to be reassigned to the new ups.   

    A campaign can:
        be public or private      

    View a List component that displays cards for each of the obects above.
    When a DM clicks on a card, they are taken to a modal that displays the details of the object.
    The modal allows the DM to perform CRUD functionality on the object.
    The modal has a read only state so they can be used to display data to the ups.

UP can:
    Create a new character (they have an arbitrary limit of 10 for now but make a config file to manage this for later)
    View a list of their characters and perform crud functionality on them(via the modal).
    submit a request to join a campaign
    view the campaign modal in read only mode

The campaign relationship table manages the many to many relationships for campaigns,
a campaign relationship entry has the campaign id, and a column for each database item (except campaign relationship and campaign) and each column in an entry contains a list of ids for each entity 

When creating a campaign the Game Master (logged in user who is creating a campaign)
    can select from existing entities and add them to the campaign (adding an entity to the campaign means an entry gets made in the campaign relationship table)

when creating a Character (whether player or non player) or monster their creation modals must have a way to see the actions that will be available to the entity. this includes generally available actions and class specific actions (this means that when the entity's class is changed the actions tab should be updated with the relevant action data.) there must also be a way to add homebrew actions within the entity's creation modal, this action is specific to the entity being created and must have a UI label that details it is a homebrew element.

When creating a character (whether player or non player) or monster the entity's attribute skills can either be assigned via the following options:
    1) "rolled" (randomly generated number from 1-20) values for each ability score
    2) assign specific point values from a shared batch of (27)

When creating an item, in addition to being able to set the values in the schema, an authenticated user can set the scope to one of the options below:
    entitySpecific (only the targeted entity can use/weild/posses the item)
    campaignSpecific (item that is given to a player character by the DM)
    global (publicly available items)

When creating an item the item's creator needs to set the ability score modifier

when an item has been equipped by an entity (player character/npc/monster) the ability score modifier should be automatically applied to the entity (or if its a combat item like a weapon the modifier should be applied when the entity takes a turn)





The schema for the objects exist in the convex folder. its the schema.ts


all components must be optomized for a mobile screen size. so all creation forms must be modals and list pages need a built in search bar that filters through the collection based off the search string

entities (player characters/npcs/monsters/items/campaigns) must have an image refernce (the image reference is a column in the entity's table and the image itself is stored in uploadthing.com)


when creating or editing a map the map creator can edit the state of individual cells,

cells can either be:
    occupied (if a cell is occupied that means an entity either player character, npcs, or monter is there, if this is the case the map has to keep track of what is occupying where)
    no terrain
    light terrain 
    medium terrain 
    hard terrain
    mythic terrain

if a cell is a terrain the map creator must set the ability score that an entity will have to roll a save agaist and they must set the modifier which can go from +2 all the way to +9 and the map creator can select the base stat the modifier will be applied to for the total dc (defaults to 10)


interactive map component

as part of an interaction DMs and UPs must have an interactive map with live updates.

at the start of the interaction the DM can place the Player characters and monsters and npcs on the map
players can move on the map acorrding to their speed attribute
dms can move npcs and monsters on the map according to their speed attribute
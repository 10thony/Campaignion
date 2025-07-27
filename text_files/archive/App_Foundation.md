-------
Foundations of the app

This application allows Dungeon Masters (DMs) and user players (ups) to do the following


Users can register, and be both DMs and ups simultaneously. 
What defines a DM is a person who has created a campaign, they are the DM for that specifi campaign.
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



The schema for the objects exist in the convex folder. its the schema.ts


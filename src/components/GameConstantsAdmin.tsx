import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export function GameConstantsAdmin() {
  const [selectedTable, setSelectedTable] = useState('equipmentSlots')
  
  // Queries for different game constant tables
  const equipmentSlots = useQuery(api.gameConstants.getEquipmentSlots)
  const actionCosts = useQuery(api.gameConstants.getActionCosts)
  const dndClasses = useQuery(api.gameConstants.getDndClasses)
  const abilityScores = useQuery(api.gameConstants.getAbilityScores)
  const pointBuyCosts = useQuery(api.gameConstants.getPointBuyCosts)
  const actionTypes = useQuery(api.gameConstants.getActionTypes)
  const damageTypes = useQuery(api.gameConstants.getDamageTypes)
  const itemTypes = useQuery(api.gameConstants.getItemTypes)
  const itemRarities = useQuery(api.gameConstants.getItemRarities)
  
  // Mutations for updating game constants
  const updateEquipmentSlot = useMutation(api.gameConstants.updateEquipmentSlot)
  const updateActionCost = useMutation(api.gameConstants.updateActionCost)
  const updateDndClass = useMutation(api.gameConstants.updateDndClass)
  const updateAbilityScore = useMutation(api.gameConstants.updateAbilityScore)
  const updatePointBuyCost = useMutation(api.gameConstants.updatePointBuyCost)
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setEditForm({ ...item })
  }

  const handleSave = async () => {
    if (!editingItem) return
    
    try {
      switch (selectedTable) {
        case 'equipmentSlots':
          await updateEquipmentSlot({
            id: editingItem._id,
            updates: editForm
          })
          break
        case 'actionCosts':
          await updateActionCost({
            id: editingItem._id,
            updates: editForm
          })
          break
        case 'dndClasses':
          await updateDndClass({
            id: editingItem._id,
            updates: editForm
          })
          break
        case 'abilityScores':
          await updateAbilityScore({
            id: editingItem._id,
            updates: editForm
          })
          break
        case 'pointBuyCosts':
          await updatePointBuyCost({
            id: editingItem._id,
            updates: editForm
          })
          break
      }
      setEditingItem(null)
      setEditForm({})
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditForm({})
  }

  const renderTable = () => {
    switch (selectedTable) {
      case 'equipmentSlots':
        return (
          <EquipmentSlotsEditor 
            slots={equipmentSlots} 
            onEdit={handleEdit}
            editingItem={editingItem}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )
      case 'actionCosts':
        return (
          <ActionCostsEditor 
            costs={actionCosts}
            onEdit={handleEdit}
            editingItem={editingItem}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )
      case 'dndClasses':
        return (
          <DndClassesEditor 
            classes={dndClasses}
            onEdit={handleEdit}
            editingItem={editingItem}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )
      case 'abilityScores':
        return (
          <AbilityScoresEditor 
            scores={abilityScores}
            onEdit={handleEdit}
            editingItem={editingItem}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )
      case 'pointBuyCosts':
        return (
          <PointBuyCostsEditor 
            costs={pointBuyCosts}
            onEdit={handleEdit}
            editingItem={editingItem}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )
      default:
        return <div>Select a table to edit</div>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Constants Administration</CardTitle>
          <CardDescription>
            Manage D&D 5e game rules and constants. Only administrators can modify these values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-select">Select Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipmentSlots">Equipment Slots</SelectItem>
                  <SelectItem value="actionCosts">Action Costs</SelectItem>
                  <SelectItem value="dndClasses">D&D Classes</SelectItem>
                  <SelectItem value="abilityScores">Ability Scores</SelectItem>
                  <SelectItem value="pointBuyCosts">Point Buy Costs</SelectItem>
                  <SelectItem value="actionTypes">Action Types</SelectItem>
                  <SelectItem value="damageTypes">Damage Types</SelectItem>
                  <SelectItem value="itemTypes">Item Types</SelectItem>
                  <SelectItem value="itemRarities">Item Rarities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {renderTable()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Individual table editors
function EquipmentSlotsEditor({ slots, onEdit, editingItem, editForm, setEditForm, onSave, onCancel }: any) {
  if (!slots) return <div>Loading equipment slots...</div>
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Equipment Slots</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Key</th>
              <th className="border border-gray-300 p-2 text-left">Label</th>
              <th className="border border-gray-300 p-2 text-left">Icon</th>
              <th className="border border-gray-300 p-2 text-left">Allowed Types</th>
              <th className="border border-gray-300 p-2 text-left">Sort Order</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot: any) => (
              <tr key={slot._id}>
                <td className="border border-gray-300 p-2">{slot.key}</td>
                <td className="border border-gray-300 p-2">{slot.label}</td>
                <td className="border border-gray-300 p-2">{slot.icon}</td>
                <td className="border border-gray-300 p-2">
                  {slot.allowedItemTypes?.join(', ')}
                </td>
                <td className="border border-gray-300 p-2">{slot.sortOrder}</td>
                <td className="border border-gray-300 p-2">
                  <Button size="sm" onClick={() => onEdit(slot)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {editingItem && (
        <EditEquipmentSlotModal
          item={editingItem}
          form={editForm}
          setForm={setEditForm}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}

function EditEquipmentSlotModal({ item, form, setForm, onSave, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Edit Equipment Slot</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={form.label || ''}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              value={form.icon || ''}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={form.sortOrder || 0}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSave}>Save</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Similar editor components for other tables...
function ActionCostsEditor({ costs, onEdit, editingItem, editForm, setEditForm, onSave, onCancel }: any) {
  if (!costs) return <div>Loading action costs...</div>
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Action Costs</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Value</th>
              <th className="border border-gray-300 p-2 text-left">Icon</th>
              <th className="border border-gray-300 p-2 text-left">Color</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-left">Sort Order</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((cost: any) => (
              <tr key={cost._id}>
                <td className="border border-gray-300 p-2">{cost.value}</td>
                <td className="border border-gray-300 p-2">{cost.icon || '-'}</td>
                <td className="border border-gray-300 p-2">
                  <Badge className={cost.color}>{cost.color}</Badge>
                </td>
                <td className="border border-gray-300 p-2">{cost.description}</td>
                <td className="border border-gray-300 p-2">{cost.sortOrder}</td>
                <td className="border border-gray-300 p-2">
                  <Button size="sm" onClick={() => onEdit(cost)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Placeholder components for other editors
function DndClassesEditor({ classes, onEdit, editingItem, editForm, setEditForm, onSave, onCancel }: any) {
  if (!classes) return <div>Loading D&D classes...</div>
  return <div>D&D Classes Editor (Implementation needed)</div>
}

function AbilityScoresEditor({ scores, onEdit, editingItem, editForm, setEditForm, onSave, onCancel }: any) {
  if (!scores) return <div>Loading ability scores...</div>
  return <div>Ability Scores Editor (Implementation needed)</div>
}

function PointBuyCostsEditor({ costs, onEdit, editingItem, editForm, setEditForm, onSave, onCancel }: any) {
  if (!costs) return <div>Loading point buy costs...</div>
  return <div>Point Buy Costs Editor (Implementation needed)</div>
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from 'joi';
import { api, User } from '@/lib/api';
import { Plus, Edit, Trash2, Shield, Users, Settings, Key } from 'lucide-react';

const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin0', 'admin1', 'admin2').required(),
  stationId: Joi.string().when('role', {
    is: Joi.valid('admin1', 'admin2'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  regionId: Joi.string().when('role', {
    is: 'admin0',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
});

type UserFormData = {
  name: string;
  email: string;
  password: string;
  role: 'admin0' | 'admin1' | 'admin2';
  stationId?: string;
  regionId?: string;
};

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<UserFormData>({
    resolver: joiResolver(userSchema),
  });

  const watchedRole = watch('role');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'superAdmin') {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superAdmin': return 'bg-red-100 text-red-800';
      case 'admin0': return 'bg-blue-100 text-blue-800';
      case 'admin1': return 'bg-green-100 text-green-800';
      case 'admin2': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const onSubmitUser = async (data: UserFormData) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
      } else {
        await api.post('/auth/register', data);
      }
      fetchUsers();
      setIsCreateDialogOpen(false);
      setEditingUser(null);
      reset();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const changePassword = async (userId: string) => {
    const newPassword = prompt('Enter new password:');
    if (newPassword && newPassword.length >= 6) {
      try {
        await api.post('/auth/admin/change-password', { userId, newPassword });
        alert('Password changed successfully');
      } catch (error) {
        console.error('Failed to change password:', error);
        alert('Failed to change password');
      }
    } else if (newPassword) {
      alert('Password must be at least 6 characters long');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setValue('name', user.name);
    setValue('email', user.email);
    setValue('role', user.role as any);
    setValue('stationId', user.stationId || '');
    setValue('regionId', user.regionId || '');
    setIsCreateDialogOpen(true);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingUser(null);
    reset();
  };

  if (loading) {
    return <div className=" flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className=" bg-gray-50">
      <div className='flex w-full justify-center'>
        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
      </div>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-gray-600">Manage police department users and their roles</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { reset(); setEditingUser(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'Update user information and permissions.' : 'Add a new police officer to the system.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmitUser)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register('name')} placeholder="Enter full name" />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="Enter email" />
                    {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                  </div>

                  {!editingUser && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" {...register('password')} placeholder="Enter password" />
                      {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={(value) => setValue('role', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin0">Regional Supervisor (Admin0)</SelectItem>
                        <SelectItem value="admin1">Station Lead (Admin1)</SelectItem>
                        <SelectItem value="admin2">Verification Officer (Admin2)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>}
                  </div>

                  {watchedRole === 'admin0' && (
                    <div>
                      <Label htmlFor="regionId">Region</Label>
                      <Select onValueChange={(value) => setValue('regionId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Northern Region">Northern Region</SelectItem>
                          <SelectItem value="Southern Region">Southern Region</SelectItem>
                          <SelectItem value="Eastern Region">Eastern Region</SelectItem>
                          <SelectItem value="Western Region">Western Region</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.regionId && <p className="text-sm text-red-600 mt-1">{errors.regionId.message}</p>}
                    </div>
                  )}

                  {(watchedRole === 'admin1' || watchedRole === 'admin2') && (
                    <div>
                      <Label htmlFor="stationId">Police Station</Label>
                      <Select onValueChange={(value) => setValue('stationId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Central Police Station">Central Police Station</SelectItem>
                          <SelectItem value="North Police Station">North Police Station</SelectItem>
                          <SelectItem value="South Police Station">South Police Station</SelectItem>
                          <SelectItem value="East Police Station">East Police Station</SelectItem>
                          <SelectItem value="West Police Station">West Police Station</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.stationId && <p className="text-sm text-red-600 mt-1">{errors.stationId.message}</p>}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingUser ? 'Update User' : 'Create User'}
                    </Button>
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                System Users
              </CardTitle>
              <CardDescription>
                All registered police department personnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Station/Region</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id || user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.stationId && typeof user.stationId === 'object' && 'name' in user.stationId
                          ? `Station: ${(user.stationId as any).name}`
                          : user.stationId
                            ? `Station: ${user.stationId}`
                            : ''}
                        {user.regionId && typeof user.regionId === 'object' && 'name' in user.regionId
                          ? `Region: ${(user.regionId as any).name}`
                          : user.regionId
                            ? `Region: ${user.regionId}`
                            : ''}
                        {!user.stationId && !user.regionId && '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changePassword(user._id || user.id)}
                          >
                            <Key className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user._id || user.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
